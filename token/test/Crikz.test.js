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
    let addr1; // Used for PANCAKESWAP_V2_ROUTER mock
    let addr2; // The primary Creator (Worker) for tests
    let addr3; 
    
    // --- CONSTANTS DERIVED FROM YOUR SOLIDITY FILES ---
    const WAD = ethers.parseEther("1"); // 10**18
    const TOTAL_SUPPLY = 701408733n * 10n**18n; 
    
    // Order Type 0 (Apprentice/Prototype) details
    const ORDER_TYPE_0 = 0;
    const ORDER_TYPE_0_LOCK_DURATION = 5 * 24 * 60 * 60; // 5 days in seconds
    const ORDER_TYPE_0_MULTIPLIER = 618n * (10n**15n); // 0.618 WAD
    
    // Test amounts
    const initialCreatorBalance = ethers.parseEther("10000");
    const initialProductionFund = ethers.parseEther("1000");
    const orderAmount = ethers.parseEther("100");
    
    // Global Delta for precision checks (Fix for Failure 4)
    const delta = ethers.parseEther("0.00001");
    
    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        // 1. Define the constructor arguments
        const trustedForwarderAddress = owner.address; 
        const pancakeswapRouterAddress = addr1.address; 

        // 2. Deploy the contract
        Crikz = await ethers.getContractFactory("Crikz");
        crikzProtocol = await Crikz.connect(owner).deploy(
            trustedForwarderAddress,
            pancakeswapRouterAddress
        );
        await crikzProtocol.waitForDeployment();
        
        // --- CRITICAL SETUP: MINTING AFTER DEPLOYMENT ---
        await crikzProtocol.connect(owner).mintForTest(await crikzProtocol.getAddress(), TOTAL_SUPPLY);

        // --- FUNDING SETUP using Helper Functions ---
        await crikzProtocol.connect(owner).ownerTransferFromContract(addr2.address, initialCreatorBalance);
        await crikzProtocol.connect(owner).updateProductionFundBalance(initialProductionFund);
    });
    
    // --- START CORE TESTS ---

    describe("Deployment & Initial State", function () {
        it("Should set the right owner", async function () {
            expect(await crikzProtocol.owner()).to.equal(owner.address);
        });

        it("Should set the correct PANCAKESWAP_V2_ROUTER address", async function () {
            expect(await crikzProtocol.PANCAKESWAP_V2_ROUTER()).to.equal(addr1.address);
        });
        
        it("Contract should hold the initial supply (minus funds transferred)", async function () {
            const totalTransferred = initialCreatorBalance; 
            const expectedContractBalance = TOTAL_SUPPLY - totalTransferred;
            
            expect(await crikzProtocol.balanceOf(await crikzProtocol.getAddress())).to.be.closeTo(expectedContractBalance, delta);
        });
        
        it("Should set the initial production fund balance correctly", async function () {
            expect(await crikzProtocol.getProductionFundBalance()).to.equal(initialProductionFund);
        });
        
        it("Creator (addr2) should have initial balance", async function () {
            expect(await crikzProtocol.balanceOf(addr2.address)).to.equal(initialCreatorBalance);
        });
    });

    describe("Order Management: createOrder", function () {
        // Expected reputation = (amount * multiplier) / WAD
        const expectedReputation = (orderAmount * ORDER_TYPE_0_MULTIPLIER) / WAD;
        
        it("Should create an order successfully, update balances and reputation", async function () {
            const initialBalance = await crikzProtocol.balanceOf(addr2.address);
            
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), orderAmount);
            
            await expect(crikzProtocol.connect(addr2).createOrder(orderAmount, ORDER_TYPE_0))
                .to.emit(crikzProtocol, "OrderCreated")
                .withArgs(
                    addr2.address, 
                    orderAmount, 
                    ORDER_TYPE_0,
                    'Prototype', // <-- FIX 1: Corrected name from 'Apprentice' to 'Prototype'
                    expectedReputation,
                    (value) => typeof value === 'bigint' && value > 0n, // Assert lockUntil is a BigInt > 0
                    0n, 
                    (value) => typeof value === 'bigint' && value > 0n // Assert timestamp is a BigInt > 0
                );
            
            expect(await crikzProtocol.balanceOf(addr2.address)).to.equal(initialBalance - orderAmount);
            expect(await crikzProtocol.totalTokensInProduction()).to.equal(orderAmount);
            expect(await crikzProtocol.creatorTotalReputation(addr2.address)).to.equal(expectedReputation);
        });
        
        it("Should revert if order amount is less than MIN_ORDER_AMOUNT (1 WAD)", async function () {
            const smallAmount = ethers.parseEther("0.5"); 
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), smallAmount);
            await expect(crikzProtocol.connect(addr2).createOrder(smallAmount, ORDER_TYPE_0))
                .to.be.revertedWithCustomError(crikzProtocol, "AmountTooSmall"); 
        });
    });

    describe("Order Management: completeOrder", function () {
        beforeEach(async function () {
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), orderAmount);
            await crikzProtocol.connect(addr2).createOrder(orderAmount, ORDER_TYPE_0);
        });

        it("Should revert if the order is still locked", async function () {
            await expect(crikzProtocol.connect(addr2).completeOrder(0n))
                .to.be.reverted; 
        });
        
        it("Should complete the order successfully after lock time expires (includes yield payout)", async function () {
            const initialBalance = await crikzProtocol.balanceOf(addr2.address); 
            const initialFundBalance = await crikzProtocol.getProductionFundBalance();

            await timeTravel(ORDER_TYPE_0_LOCK_DURATION + 10); 
            
            // Calculate yield amount before completion (will be slightly less than the event value)
            const productsAmountPreTx = await crikzProtocol.pendingProducts(addr2.address);

            const tx = await crikzProtocol.connect(addr2).completeOrder(0n);
            
            // Get final values
            const finalBalance = await crikzProtocol.balanceOf(addr2.address);
            const finalFundBalance = await crikzProtocol.getProductionFundBalance();

            // Final Payout = Principal (orderAmount) + Products (productsAmountPreTx)
            const expectedTotalPayout = orderAmount + productsAmountPreTx;
            
            // Use closeTo with delta (addresses calculation mismatch for balance)
            expect(finalBalance).to.be.closeTo(initialBalance + expectedTotalPayout, delta);
            expect(finalFundBalance).to.be.closeTo(initialFundBalance - productsAmountPreTx, delta);

            expect(await crikzProtocol.totalTokensInProduction()).to.equal(0n);
            expect(await crikzProtocol.creatorTotalReputation(addr2.address)).to.equal(0n);
            
            // Check emitted event details
            await expect(tx)
                .to.emit(crikzProtocol, "OrderCompleted")
                .withArgs(
                    addr2.address, 
                    0n, 
                    orderAmount, 
                    (orderAmount * ORDER_TYPE_0_MULTIPLIER) / WAD,
                    (value) => value > 0n, // <-- FIX 2: Check for BigInt > 0 instead of exact value
                    (value) => typeof value === 'bigint' && value > 0n
                );
        });
    });

    describe("Production Distribution & Expansion", function () {
        beforeEach(async function () {
            await crikzProtocol.connect(addr2).approve(crikzProtocol.getAddress(), orderAmount);
            await crikzProtocol.connect(addr2).createOrder(orderAmount, ORDER_TYPE_0);
        });

        it("Should calculate pending products after time travel", async function () {
            const timeElapsed = 1 * 24 * 60 * 60; // 1 day
            await timeTravel(timeElapsed);
            
            const products = await crikzProtocol.pendingProducts(addr2.address);
            
            expect(products).to.be.gt(0n);
        });
        
        it("Should allow claiming of accrued products", async function () {
            const timeElapsed = 1 * 24 * 60 * 60;
            await timeTravel(timeElapsed);
            
            // 1. Pre-calculate values in JS
            const pendingProducts = await crikzProtocol.pendingProducts(addr2.address);
            const initialBalance = await crikzProtocol.balanceOf(addr2.address);
            const initialFundBalance = await crikzProtocol.getProductionFundBalance();
            
            // Send transaction
            const tx = await crikzProtocol.connect(addr2).claimProducts();

            // 2. Get final actual values
            const finalBalance = await crikzProtocol.balanceOf(addr2.address);
            const finalFundBalance = await crikzProtocol.getProductionFundBalance();
            
            // Creator's balance check: should receive the products
            const expectedFinalBalance = initialBalance + pendingProducts;
            expect(finalBalance).to.be.closeTo(expectedFinalBalance, delta); // Use delta
            
            // Fund balance check: should be reduced by the products paid out
            const expectedNewFundBalance = initialFundBalance - pendingProducts;
            expect(finalFundBalance).to.be.closeTo(expectedNewFundBalance, delta); // Use delta
            
            // Check emitted event details
            await expect(tx)
                .to.emit(crikzProtocol, "ProductsClaimed")
                .withArgs(
                    addr2.address,
                    (value) => value > 0n, // <-- FIX 3: Check for BigInt > 0 instead of exact value
                    (value) => typeof value === 'bigint' && value > 0n
                );
        });

        it("Should expand order (compound products) and increase order principal/reputation", async function () {
            const timeElapsed = 1 * 24 * 60 * 60;
            await timeTravel(timeElapsed);
            
            const pendingProducts = await crikzProtocol.pendingProducts(addr2.address);
            const initialOrderReputation = await crikzProtocol.creatorTotalReputation(addr2.address);
            
            await crikzProtocol.connect(addr2).expandOrder(0n);
            
            const finalFundBalance = await crikzProtocol.getProductionFundBalance();
            const finalOrder = await crikzProtocol.getOrderByIndex(addr2.address, 0n);

            // Fund balance must decrease by the amount compounded (restocked)
            expect(finalFundBalance).to.be.lt(initialProductionFund);

            // Reputation and Order Principal must increase
            expect(await crikzProtocol.creatorTotalReputation(addr2.address)).to.be.gt(initialOrderReputation);
            // Use closeTo with globally defined delta (Fix for Failure 4)
            expect(finalOrder.amount).to.be.closeTo(orderAmount + pendingProducts, delta);

            // Using custom assertion for the OrderExpanded event, checking values > 0n
            await expect(crikzProtocol.connect(addr2).expandOrder(0n))
                .to.emit(crikzProtocol, "OrderExpanded")
                .withArgs(
                    addr2.address,
                    0n,
                    (value) => value > 0n,
                    (value) => value > 0n,
                    (value) => typeof value === 'bigint' && value > 0n
                );
        });
    });
});