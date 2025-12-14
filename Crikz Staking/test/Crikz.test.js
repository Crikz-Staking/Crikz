const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz Staking Contract", function () {
    let Crikz, crikz, owner, addr1, addr2, router, lpPair;
    const initialSupply = ethers.parseEther("1000000"); // 1 Million
    const stakingAmount = ethers.parseEther("1000"); // 1,000 Crikz
    const minStake = ethers.parseEther("1"); // Assumed min stake from CrikzMath

    // Tier 1: 30 days lock, low weight (index 0)
    const TIER_1 = 0;
    // Tier 2: 90 days lock, high weight (index 1)
    const TIER_2 = 1;

    // Helper to advance time
    const advanceTime = async (seconds) => {
        await ethers.provider.send("evm_increaseTime", [seconds]);
        await ethers.provider.send("evm_mine");
    };

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        router = ethers.Wallet.createRandom().address;
        lpPair = ethers.Wallet.createRandom().address;

        Crikz = await ethers.getContractFactory("Crikz");
        crikz = await Crikz.deploy(owner.address, router);
        await crikz.waitForDeployment();

        // Transfer funds for testing (200k to addr1, 100k to addr2)
        await crikz.transfer(addr1.address, ethers.parseEther("200000"));
        await crikz.transfer(addr2.address, ethers.parseEther("100000"));

        // Set LP Pair to disable fees during transfers involving addr1/addr2 for simplicity
        await crikz.setLPPairAddress(lpPair);

        // Approve contract to spend tokens
        await crikz.connect(addr1).approve(crikz.target, stakingAmount);
        await crikz.connect(addr2).approve(crikz.target, stakingAmount);
    });

    // --- Core Tests (already passing, included for completeness) ---
    describe("Staking Functionality", function () {
        it("Should allow a user to stake and update contract state", async function () {
            await crikz.connect(addr1).stake(stakingAmount, TIER_1);

            const stakeInfo = await crikz.getStake(addr1.address, 0);
            expect(stakeInfo.amount).to.equal(stakingAmount);

            const stats = await crikz.getContractStats();
            expect(stats._totalStaked).to.equal(stakingAmount);
            expect(stats._totalStakers).to.equal(1);
        });
    });

    // --- Unstake Tests (Testing the fix for lock duration) ---
    describe("Unstake Functionality", function () {
        beforeEach(async function () {
            // Stake 1000 tokens in TIER 1 (30 days lock)
            await crikz.connect(addr1).stake(stakingAmount, TIER_1);
        });

        it("Should REVERT if the user tries to unstake before lock time expires", async function () {
            // Advance time by 1 day (less than 30 days lock)
            await advanceTime(1 * 24 * 60 * 60);

            await expect(
                crikz.connect(addr1).unstake(0)
            ).to.be.revertedWith("CRKZ: Stake is locked");
        });

        it("Should allow the user to unstake after lock time expires", async function () {
            const initialBalance = await crikz.balanceOf(addr1.address);
            
            // Advance time past the 30-day lock + 1 second buffer
            await advanceTime(30 * 24 * 60 * 60 + 1);
            
            // The user must claim rewards (which happens internally in unstake)
            // But we check the main unstake action
            await crikz.connect(addr1).unstake(0);

            const finalBalance = await crikz.balanceOf(addr1.address);
            const stats = await crikz.getContractStats();

            // Balance should increase by the staking amount
            expect(finalBalance).to.equal(initialBalance + stakingAmount);
            expect(stats._totalStaked).to.equal(0);
            expect(stats._totalStakers).to.equal(0);
        });
    });

    // --- Emergency Unstake Tests (Testing the fix) ---
    describe("Emergency Unstake Functionality", function () {
        beforeEach(async function () {
            // Stake 1000 tokens in TIER 2 (90 days lock)
            await crikz.connect(addr1).stake(stakingAmount, TIER_2);
        });

        it("Should allow emergency unstake when locked and burn the fee", async function () {
            const initialBalance = await crikz.balanceOf(addr1.address);
            const initialBurned = (await crikz.getContractStats())._totalBurned;
            
            // Emergency unstake immediately (while locked)
            await crikz.connect(addr1).emergencyUnstake(0);

            const finalBalance = await crikz.balanceOf(addr1.address);
            const stats = await crikz.getContractStats();

            // Expected burn fee is 1.618% of 1000 = 16.18 tokens
            const expectedBurn = stakingAmount * 1618n / 100000n;
            const expectedReturn = stakingAmount - expectedBurn;

            // Balance should increase by the net returned amount
            expect(finalBalance).to.equal(initialBalance + expectedReturn);
            expect(stats._totalBurned).to.equal(initialBurned + expectedBurn);
            expect(stats._totalStaked).to.equal(0);
        });
    });

    // --- Compounding Rewards Tests (Testing the logic) ---
    describe("Compounding Rewards Functionality", function () {
        it("Should correctly compound rewards and increase stake weight/amount", async function () {
            // Stake with TIER 2 (higher weight factor for better reward testing)
            await crikz.connect(addr1).stake(stakingAmount, TIER_2);
            const initialStakeInfo = await crikz.getStake(addr1.address, 0);

            // Advance time significantly to accrue rewards (e.g., 60 days)
            await advanceTime(60 * 24 * 60 * 60);

            const pending = await crikz.pendingRewards(addr1.address);
            expect(pending).to.be.gt(0, "Should have pending rewards");

            const initialTotalStaked = (await crikz.getContractStats())._totalStaked;
            const initialPoolWeight = (await crikz.getContractStats())._rewardPoolTotalWeight;

            // Compound the rewards
            await crikz.connect(addr1).compoundRewards(0);
            
            const finalStakeInfo = await crikz.getStake(addr1.address, 0);
            const finalTotalStaked = (await crikz.getContractStats())._totalStaked;
            const finalPoolWeight = (await crikz.getContractStats())._rewardPoolTotalWeight;

            // Check if stake amount increased by pending rewards
            expect(finalStakeInfo.amount).to.equal(initialStakeInfo.amount + pending);
            
            // Check if total staked increased
            expect(finalTotalStaked).to.equal(initialTotalStaked + pending);
            
            // Check if weight increased (due to compounding)
            expect(finalStakeInfo.weight).to.be.gt(initialStakeInfo.weight);
            
            // Check if pool weight increased
            expect(finalPoolWeight).to.be.gt(initialPoolWeight);
            
            // Check if new pending rewards are 0 or near 0 after compounding
            const newPending = await crikz.pendingRewards(addr1.address);
            expect(newPending).to.be.lt(minStake, "Pending rewards should be near zero after compounding");
        });
    });
});