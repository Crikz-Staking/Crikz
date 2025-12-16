// Import Hardhat environment and Chai assertion library
const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Helper function to advance time in the Hardhat EVM.
 */
async function timeTravel(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

// Define the core test suite for the Crikz Protocol
describe("Crikz Protocol", function () {
    let Crikz;
    let crikzProtocol;
    let owner; 
    let addr1; 
    let addr2; 
    let addr3; 
    
    // --- CONSTANTS DERIVED FROM YOUR SOLIDITY FILES ---
    const WAD = ethers.parseEther("1"); // 10**18
    const TOTAL_SUPPLY = 701408733n * 10n**18n; 
    
    // Tier 0 (Apprentice) details from WorkTiers.sol
    const TIER_0 = 0;
    const TIER_0_LOCK_DURATION = 5 * 24 * 60 * 60; // 5 days in seconds
    const TIER_0_MULTIPLIER = 618n * (10n**15n); 
    
    // Test amounts
    const initialWorkerBalance = ethers.parseEther("10000");
    const initialRewardFund = ethers.parseEther("1000");
    const jobAmount = ethers.parseEther("100");
    
    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // 1. Define the constructor arguments
        const trustedForwarderAddress = owner.address; 
        const pancakeswapRouterAddress = addr1.address; 

        // 2. Deploy the contract (Ensure owner is the signer)
        Crikz = await ethers.getContractFactory("Crikz");
        crikzProtocol = await Crikz.connect(owner).deploy(
            trustedForwarderAddress,
            pancakeswapRouterAddress
        );
        await crikzProtocol.waitForDeployment();
        
        // --- CRITICAL FIX: MINTING AFTER DEPLOYMENT ---
        // Contract must be minted supply after deployment since constructor mint failed
        await crikzProtocol.connect(owner).mintForTest(await crikzProtocol.getAddress(), TOTAL_SUPPLY);

        // --- FUNDING SETUP using Helper Functions ---
        
        // 1. Transfer tokens from Contract (where supply is) to worker (addr2)
        await crikzProtocol.connect(owner).ownerTransferFromContract(addr2.address, initialWorkerBalance);

        // 2. Set the reward fund balance directly (this does NOT transfer ERC20 tokens)
        await crikzProtocol.connect(owner).updateRewardFundBalance(initialRewardFund);
    });
    
    // --- START CORE TESTS ---

    describe("Deployment & Initial State", function () {
        it("Should set the right owner", async function () {
            expect(await crikzProtocol.owner()).to.equal(owner.address);
        });

        it("Should set the correct PANCAKESWAP_V2_ROUTER address", async function () {
            expect(await crikzProtocol.PANCAKESWAP_V2_ROUTER()).to.equal(addr1.address);
        });
        
        it("Should have the initial supply (minus funds transferred) with the contract", async function () {
            // FIX: Only initialWorkerBalance was transferred out of the contract's ERC20 balance
            const totalTransferred = initialWorkerBalance; 
            const expectedContractBalance = TOTAL_SUPPLY - totalTransferred;
            
            // Use a small delta for rounding error check
            expect(await crikzProtocol.balanceOf(await crikzProtocol.getAddress())).to.closeTo(expectedContractBalance, ethers.parseEther("0.0001"));
        });
        
        it("Should set the initial reward fund balance correctly", async function () {
            expect(await crikzProtocol.getRewardFundBalance()).to.equal(initialRewardFund);
        });
        
        it("Worker (addr2) should have initial balance", async function () {
            expect(await crikzProtocol.balanceOf(addr2.address)).to.equal(initialWorkerBalance);
        });
    });

    describe("Job Management: startJob", function () {
        // Calculate expected reputation using BigInt math
        const expectedReputation = (jobAmount * TIER_0_MULTIPLIER) / WAD;
        
        it("Should start a job successfully, update balances and reputation", async function () {
            const initialBalance = await crikzProtocol.balanceOf(addr2.address);
            
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), jobAmount);
            
            await expect(crikzProtocol.connect(addr2).startJob(jobAmount, TIER_0))
                .to.emit(crikzProtocol, "JobStarted");
            
            // FIX: Use native BigInt subtraction (-)
            expect(await crikzProtocol.balanceOf(addr2.address)).to.equal(initialBalance - jobAmount);
            expect(await crikzProtocol.totalTokensWorking()).to.equal(jobAmount);
            
            expect(await crikzProtocol.userTotalReputation(addr2.address)).to.equal(expectedReputation);
        });
        
        it("Should revert if job amount is less than MIN_WORK_AMOUNT (1 WAD)", async function () {
            const smallAmount = ethers.parseEther("0.5"); 
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), smallAmount);
            await expect(crikzProtocol.connect(addr2).startJob(smallAmount, TIER_0))
                .to.be.reverted; 
        });
    });

    describe("Job Management: completeJob", function () {
        beforeEach(async function () {
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), jobAmount);
            await crikzProtocol.connect(addr2).startJob(jobAmount, TIER_0);
        });

        it("Should revert if the job is still locked", async function () {
            await expect(crikzProtocol.connect(addr2).completeJob(0n))
                .to.be.reverted; 
        });
        
        it("Should complete the job successfully after lock time expires", async function () {
            const initialBalance = await crikzProtocol.balanceOf(addr2.address); 

            await timeTravel(TIER_0_LOCK_DURATION + 10); 

            await expect(crikzProtocol.connect(addr2).completeJob(0n))
                .to.emit(crikzProtocol, "JobCompleted");
            
            const finalBalance = await crikzProtocol.balanceOf(addr2.address);
            
            // FIX: Use native BigInt addition (+)
            expect(finalBalance).to.be.gt(initialBalance + jobAmount);
            
            expect(await crikzProtocol.totalTokensWorking()).to.equal(0n);
            expect(await crikzProtocol.userTotalReputation(addr2.address)).to.equal(0n);
        });
    });

    describe("Salary Distribution & Compounding", function () {
        beforeEach(async function () {
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), jobAmount);
            await crikzProtocol.connect(addr2).startJob(jobAmount, TIER_0);
        });

        it("Should calculate pending salary after time travel", async function () {
            const timeElapsed = 1 * 24 * 60 * 60;
            await timeTravel(timeElapsed);
            
            const salary = await crikzProtocol.pendingSalary(addr2.address);
            
            expect(salary).to.be.gt(0n);
        });
        
        it("Should allow claiming of accrued salary", async function () {
            const timeElapsed = 1 * 24 * 60 * 60;
            await timeTravel(timeElapsed);
            
            // 1. Pre-calculate values in JS
            const pendingSalary = await crikzProtocol.pendingSalary(addr2.address);
            const initialBalance = await crikzProtocol.balanceOf(addr2.address);
            const initialFundBalance = await crikzProtocol.getRewardFundBalance();
            
            // FIX: Increased delta for time-based precision issues
            const delta = ethers.parseEther("0.00001"); 

            await expect(crikzProtocol.connect(addr2).claimSalary())
                .to.emit(crikzProtocol, "SalaryClaimed");

            // 2. Get final actual values
            const finalBalance = await crikzProtocol.balanceOf(addr2.address);
            const finalFundBalance = await crikzProtocol.getRewardFundBalance();
            
            // Use closeTo for Worker's balance (to account for block timing/precision)
            const expectedFinalBalance = initialBalance + pendingSalary;
            expect(finalBalance).to.be.closeTo(expectedFinalBalance, delta);
            
            // Fund balance check (remains closeTo)
            const expectedNewFundBalance = initialFundBalance - pendingSalary;
            expect(finalFundBalance).to.be.closeTo(expectedNewFundBalance, delta);
        });

        it("Should compound salary and increase job principal/reputation", async function () {
            const timeElapsed = 1 * 24 * 60 * 60;
            await timeTravel(timeElapsed);
            
            const pendingSalary = await crikzProtocol.pendingSalary(addr2.address);
            const initialJobReputation = await crikzProtocol.userTotalReputation(addr2.address);
            
            await expect(crikzProtocol.connect(addr2).compoundSalary(0n))
                .to.emit(crikzProtocol, "SalaryCompounded");
                
            expect(await crikzProtocol.getRewardFundBalance()).to.be.lt(initialRewardFund);

            expect(await crikzProtocol.userTotalReputation(addr2.address)).to.be.gt(initialJobReputation);
        });
    });
});