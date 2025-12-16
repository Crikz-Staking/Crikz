const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const utils = ethers.utils;
const oneDay = 60 * 60 * 24;
const tenDays = oneDay * 10;
const TIER_0_DURATION = oneDay * 30;
const WAD = utils.parseUnits("1", 18);

describe("Crikz.test.js", function () {
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let routerAddress;

    const initialSupply = utils.parseEther("1000000"); // 1M tokens
    const rewardAllocation = utils.parseEther("250000"); // 250K tokens
    const lpPairAddress = "0x8888888888888888888888888888888888888888"; // Mock LP
    const stakeAmount = utils.parseEther("1000"); // Standard test stake amount

    async function deployCrikzFixture() {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        routerAddress = addrs[9].address;
        
        const Crikz = await ethers.getContractFactory("contracts/CrikzV2.sol:CrikzV2");
        const crikz = await Crikz.deploy(owner.address, routerAddress);
        await crikz.deployed();
        
        return { crikz, owner, addr1, addr2, lpPairAddress };
    }

    describe("Crikz Contract Deployment and Initialization", function () {
        it("Should set the correct initial supply and owner balances", async function () {
            const { crikz, owner } = await loadFixture(deployCrikzFixture);
            expect(await crikz.totalSupply()).to.equal(initialSupply);
            expect(await crikz.balanceOf(owner.address)).to.equal(initialSupply.sub(rewardAllocation));
            expect(await crikz.balanceOf(crikz.address)).to.equal(rewardAllocation);
        });

        it("Should correctly initialize staking tiers", async function () {
            const { crikz } = await loadFixture(deployCrikzFixture);
            const tier0 = await crikz.getTierDetails(0);
            expect(tier0.lockDuration).to.equal(oneDay * 30);
            expect(tier0.weightFactor).to.equal(utils.parseUnits("1", 18));
        });

        it("Should not allow setting the LP pair address twice", async function () {
            const { crikz, owner, lpPairAddress } = await loadFixture(deployCrikzFixture);
            await crikz.connect(owner).setLPPairAddress(lpPairAddress);
            await expect(crikz.connect(owner).setLPPairAddress(lpPairAddress)).to.be.revertedWith("Crikz: LP address already set.");
        });

        it("Should restrict admin functions to owner only", async function () {
            const { crikz, addr1 } = await loadFixture(deployCrikzFixture);
            await expect(crikz.connect(addr1).setLPPairAddress(addr1.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Crikz Staking Functionality", function () {
        let crikz, owner, addr1, addr2;

        beforeEach(async function() {
            ({ crikz, owner, addr1, addr2 } = await loadFixture(deployCrikzFixture));
            const requiredAmount = stakeAmount.mul(10); 
            await crikz.connect(owner).transfer(addr1.address, requiredAmount); 
            await crikz.connect(owner).transfer(addr2.address, requiredAmount); 
        });
        
        it("Should allow a user to stake tokens and update totals", async function () {
            const initialTotalStaked = await crikz.totalStaked();
            const initialBalance = await crikz.balanceOf(addr1.address);
            await crikz.connect(addr1).approve(crikz.address, stakeAmount);
            await crikz.connect(addr1).stake(stakeAmount, 0);

            expect(await crikz.totalStaked()).to.equal(initialTotalStaked.add(stakeAmount));
            expect(await crikz.balanceOf(addr1.address)).to.equal(initialBalance.sub(stakeAmount));
        });

        it("Should prevent unstaking before the lock period expires", async function () {
            await crikz.connect(addr1).approve(crikz.address, stakeAmount);
            await crikz.connect(addr1).stake(stakeAmount, 0);
            await time.increase(tenDays);
            await expect(crikz.connect(addr1).unstake(0)).to.be.revertedWith("CRKZ: Stake is locked");
        });

        it("Should allow unstaking after the lock period expires and clear stake info", async function () {
            await crikz.connect(addr1).approve(crikz.address, stakeAmount);
            await crikz.connect(addr1).stake(stakeAmount, 0);
            const initialBalance = await crikz.balanceOf(addr1.address);
            await time.increase(TIER_0_DURATION + 1);
            await crikz.connect(addr1).unstake(0);
            expect(await crikz.balanceOf(addr1.address)).to.equal(initialBalance.add(stakeAmount));
        });

        it("Should correctly accrue rewards over time for a single staker", async function () {
            await crikz.connect(addr1).approve(crikz.address, stakeAmount);
            await crikz.connect(addr1).stake(stakeAmount, 0);
            await time.increase(tenDays); 
            expect(await crikz.pendingRewards(addr1.address)).to.be.gt(0); 
        });
    });
});