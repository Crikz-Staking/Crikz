// Crikz.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Helper function to advance time in the Hardhat EVM.
 */
async function timeTravel(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

describe("Crikz Protocol: Advanced Functions & Security", function () {
    let Crikz;
    let crikzProtocol;
    let owner; 
    let lpAddress; // Mock address for the DEX LP Pair (where tax applies)
    let userA; // Primary Creator/Producer
    let userB; // Second user for P2P transfers
    
    // --- CONSTANTS ---
    const WAD = ethers.parseEther("1"); // 10**18
    const TOTAL_SUPPLY = 701408733n * 10n**18n; 
    
    // Test parameters
    const ORDER_TYPE_0 = 0;
    const ORDER_TYPE_7 = 7; 
    const orderAmount = ethers.parseEther("1000");
    const initialCreatorBalance = ethers.parseEther("2000"); 
    const initialProductionFund = ethers.parseEther("5000"); 
    
    // Golden Ratio Tax: 1.618%
    const taxNumerator = 1618n; 
    const taxDenominator = 100000n; 
    
    // Delta for precision checks (0.00001 ETH)
    const delta = ethers.parseEther("0.00001");
    
    beforeEach(async function () {
        // Explicitly get signers and set up context
        const signers = await ethers.getSigners();
        owner = signers[0];
        lpAddress = signers[1]; 
        userA = signers[2];
        userB = signers[3];

        // 1. Deploy the contract using the 'owner' signer (signer[0])
        Crikz = await ethers.getContractFactory("Crikz", owner);
        crikzProtocol = await Crikz.deploy(
            owner.address, // trustedForwarder
            owner.address // Pancakeswap Router (using owner address as a temporary placeholder)
        );
        await crikzProtocol.waitForDeployment();
        
        const crikzProtocolAddress = await crikzProtocol.getAddress();
        
        // 2. Setup initial supply and fund balances 
        await crikzProtocol.mintForTest(crikzProtocolAddress, TOTAL_SUPPLY);
        await crikzProtocol.updateProductionFundBalance(initialProductionFund); 

        // 3. Fund users (Owner-only calls)
        await crikzProtocol.ownerTransferFromContract(userA.address, initialCreatorBalance);
        await crikzProtocol.ownerTransferFromContract(userB.address, initialCreatorBalance);

        // 4. Set the LP Pair address for tax calculation 
        // Using the test helper function to bypass the VM signer bug.
        // NOTE: This assumes you added setLPPairAddressForTest to Crikz.sol
        await crikzProtocol.connect(owner).setLPPairAddressForTest(lpAddress.address);
    });
    
    // --- TESTING TOKENOMICS: DEX TAX ---

    describe("Tokenomics: Tax and Transfers", function () {
        it("Should NOT apply tax for normal wallet-to-wallet transfers (P2P)", async function () {
            const initialBalanceB = await crikzProtocol.balanceOf(userB.address);
            
            // Transfer 1000 tokens from A to B
            const transferAmount = ethers.parseEther("1000");
            await crikzProtocol.connect(userA).transfer(userB.address, transferAmount);
            
            // User B should receive the full amount
            const finalBalanceB = await crikzProtocol.balanceOf(userB.address);
            expect(finalBalanceB).to.equal(initialBalanceB + transferAmount);

            // Contract uses getProductionFundBalance
            expect(await crikzProtocol.getProductionFundBalance()).to.equal(initialProductionFund);
        });

        it("Should apply 1.618% tax when transferring TO the LP pair (Simulated Buy/Add Liquidity)", async function () {
            const transferAmount = orderAmount; 
            const expectedTax = (transferAmount * taxNumerator) / taxDenominator; 

            // Contract uses getProductionFundBalance
            const initialFundBalance = await crikzProtocol.getProductionFundBalance();

            // Transfer from userA to the mock LP address
            await crikzProtocol.connect(userA).transfer(lpAddress.address, transferAmount);

            // Fund balance should increase by the tax amount
            const finalFundBalance = await crikzProtocol.getProductionFundBalance();
            
            expect(finalFundBalance).to.be.closeTo(initialFundBalance + expectedTax, delta);

            // LP address should receive (amount - tax)
            expect(await crikzProtocol.balanceOf(lpAddress.address)).to.be.closeTo(transferAmount - expectedTax, delta);
        });
        
        it("Should apply 1.618% tax when transferring FROM the LP pair (Simulated Sell/Remove Liquidity)", async function () {
            const transferAmount = orderAmount;
            
            // 1. Seed the LP address with tokens so it can transfer out
            await crikzProtocol.connect(userA).transfer(lpAddress.address, transferAmount);
            // Contract uses getProductionFundBalance
            const fundBalanceAfterSeed = await crikzProtocol.getProductionFundBalance();
            
            const lpBalanceBeforeTransfer = await crikzProtocol.balanceOf(lpAddress.address);
            const userBBalanceBeforeTransfer = await crikzProtocol.balanceOf(userB.address);

            // 2. LP address transfers the tokens to userB (simulating a sell)
            // Note: lpBalanceBeforeTransfer is the amount being transferred.
            const taxOnTransfer = (lpBalanceBeforeTransfer * taxNumerator) / taxDenominator; // FIX: Calculate tax on the amount being transferred
            const amountReceived = lpBalanceBeforeTransfer - taxOnTransfer; // FIX: Calculate amount received based on the new tax
            
            await crikzProtocol.connect(lpAddress).transfer(userB.address, lpBalanceBeforeTransfer);
            
            // Tax check: The fund should increase again from the LP's transfer
            const finalFundBalance = await crikzProtocol.getProductionFundBalance();
            expect(finalFundBalance).to.be.closeTo(fundBalanceAfterSeed + taxOnTransfer, delta); 
            
            // User B's received amount should be the calculated amountReceived
            const userBReceived = await crikzProtocol.balanceOf(userB.address);

            // Use closeTo because of the tax applied in the seeding step
            expect(userBReceived).to.be.closeTo(userBBalanceBeforeTransfer + amountReceived, delta * 2n);
        });
    });

    // --- TESTING EARLY EXIT & PAUSABLE LOGIC ---

    describe("Order Management: Early Termination", function () {

        beforeEach(async function () {
            // Setup an order for user A
            await crikzProtocol.connect(userA).approve(await crikzProtocol.getAddress(), orderAmount);
            await crikzProtocol.connect(userA).createOrder(orderAmount, ORDER_TYPE_0);
        });

        it("Should revert if order is still locked on completeOrder (sanity check)", async function () {
            await expect(crikzProtocol.connect(userA).completeOrder(0n))
                .to.be.reverted; 
        });

        it("Should not apply penalty but refund full principal upon cancelOrder", async function () {
            const timeElapsed = 24 * 60 * 60; // 1 day
            await timeTravel(timeElapsed);
            
            // 1. Pre-transaction checks
            const pendingProducts = await crikzProtocol.pendingProducts(userA.address);
            expect(pendingProducts).to.be.gt(0n); // Yield must have accrued
            
            const initialBalance = await crikzProtocol.balanceOf(userA.address);
            
            // 2. Cancel the job
            const tx = await crikzProtocol.connect(userA).cancelOrder(0n);
            
            // 3. Post-transaction assertions
            
            // a) Balance Check: User receives FULL principal (orderAmount)
            const finalBalance = await crikzProtocol.balanceOf(userA.address);
            expect(finalBalance).to.be.closeTo(initialBalance + orderAmount, delta);
            
            // b) Order/Reputation Check: Reputation should be zero after removing the order
            expect(await crikzProtocol.creatorTotalReputation(userA.address)).to.equal(0n);
            
            // d) Event Check
             await expect(tx)
                .to.emit(crikzProtocol, "OrderCancelled")
                .withArgs(
                    userA.address, 
                    0n,
                    orderAmount,
                    (value) => value > 0n, // Timestamp
                ); 
        });
    });

    // --- TESTING SECURITY & ADMIN FUNCTIONS ---

    describe("Security & Administrative Controls", function () {

        it("Should allow Owner to pause and block user actions", async function () {
            // 1. Owner pauses
            await crikzProtocol.pause();

            // 2. Verify user action reverts
            await crikzProtocol.connect(userA).approve(await crikzProtocol.getAddress(), orderAmount);
            await expect(crikzProtocol.connect(userA).createOrder(orderAmount, ORDER_TYPE_0))
                .to.be.reverted;

            // 3. Owner unpauses
            await crikzProtocol.unpause();

            // 4. Verify user action succeeds
            await expect(crikzProtocol.connect(userA).createOrder(orderAmount, ORDER_TYPE_0))
                .to.emit(crikzProtocol, "OrderCreated");
        });

        it("Should prevent Owner from setting the LP Pair address more than once", async function () {
            // The LP Pair address was already set in the beforeEach block using the test helper. 
            const newLpAddress = userB.address;
            
            await expect(crikzProtocol.connect(owner).setLPPairAddressForTest(newLpAddress))
                .to.be.revertedWithCustomError(crikzProtocol, "LPPairAlreadySet");

            // Non-Owner action should revert with unauthorized error
            // FIX: Reverted to standard revert string for v4.x compatibility
            await expect(crikzProtocol.connect(userA).setLPPairAddress(userA.address))
                .to.be.revertedWith("Ownable: caller is not the owner"); 
        });
    });

    // --- TESTING USER ACTION REVERTS ---

    describe("User Action Revert Cases", function () {

        it("Should revert if creating an order with an invalid tier index", async function () {
            await crikzProtocol.connect(userA).approve(await crikzProtocol.getAddress(), orderAmount);
            
            // Tier 7 does not exist (max is 6)
            await expect(crikzProtocol.connect(userA).createOrder(orderAmount, ORDER_TYPE_7))
                .to.be.reverted; 
        });

        it("Should revert if completing a non-existent order index", async function () {
            // User A has no jobs yet (pre-order creation)
            await expect(crikzProtocol.connect(userA).completeOrder(0n))
                .to.be.reverted; 
            
            // Create a job
            await crikzProtocol.connect(userA).approve(await crikzProtocol.getAddress(), orderAmount);
            await crikzProtocol.connect(userA).createOrder(orderAmount, ORDER_TYPE_0);
            
            // Now index 1 should revert
             await expect(crikzProtocol.connect(userA).completeOrder(1n))
                .to.be.reverted; 
        });
    });
});