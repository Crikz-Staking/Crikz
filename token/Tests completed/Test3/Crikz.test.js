const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz Protocol: Comprehensive Test Suite", function () {
    // --- Constants ---
    const MIN_ORDER_AMOUNT = ethers.parseEther("1000");
    const INITIAL_FUND_AMOUNT = ethers.parseEther("50000");
    const TEST_ORDER_AMOUNT = ethers.parseEther("10000");
    const ORDER_TYPE_0 = 0;
    
    // Final Constants confirmed
    const ORDER_TYPE_0_LOCK = 5 * 24 * 60 * 60; // 5 days (432,000 seconds)
    const ORDER_TYPE_0_MULTIPLIER = ethers.parseEther("0.618"); 
    const ORDER_TYPE_0_NAME = "Prototype"; // Fixed for View Function Data Integrity Test
    const MAX_ORDERS = 50;

    // Tolerance confirmed to handle yield calculation precision error
    const YIELD_TOLERANCE = 100000000000000n; // 100 trillion wei tolerance
    
    // Calculated tax rate in BigInt
    const TAX_RATE_NUMERATOR = 1618n;
    const TAX_RATE_DENOMINATOR = 100000n;
    
    async function calculateTax(amount) {
        return (amount * TAX_RATE_NUMERATOR) / TAX_RATE_DENOMINATOR;
    }

    async function deployFixture() {
        const [owner, creator, user1, user2, lpPair, trustedForwarder, router] = await ethers.getSigners();
        const Crikz = await ethers.getContractFactory("Crikz");
        const crikz = await Crikz.deploy(trustedForwarder.address, router.address);

        await crikz.mintForTest(owner.address, crikz.TOTAL_SUPPLY());
        await crikz.transfer(creator.address, ethers.parseEther("500000"));
        await crikz.connect(owner).setLPPairAddress(lpPair.address);
        await crikz.connect(owner).fundProductionPool(INITIAL_FUND_AMOUNT);
        
        // Fixture is clean (no orders pre-created)
        return { crikz, owner, creator, user1, user2, lpPair, trustedForwarder, router };
    }

    describe("Deployment & Admin Revert Edge Cases", function () {
        it("Should set the initial production fund balance correctly", async function () {
            const { crikz } = await loadFixture(deployFixture);
            expect(await crikz.getProductionFundBalance()).to.equal(INITIAL_FUND_AMOUNT);
        });

        it("Should revert if deploying with address(0) for Pancakeswap Router", async function () {
            const { trustedForwarder } = await loadFixture(deployFixture);
            const Crikz = await ethers.getContractFactory("Crikz");
            
            await expect(Crikz.deploy(trustedForwarder.address, ethers.ZeroAddress))
                .to.be.revertedWithCustomError(Crikz, "InvalidAddress");
        });

        it("Should revert setLPPairAddress if address(0) is passed", async function () {
            const { crikz, owner } = await loadFixture(deployFixture);
            
            // Using setLPPairAddressForTest helper to bypass onlyOwner for revert check
            await expect(crikz.connect(owner).setLPPairAddressForTest(ethers.ZeroAddress))
                .to.be.revertedWithCustomError(crikz, "InvalidAddress");
            
            await expect(crikz.connect(owner).setLPPairAddress(owner.address))
                .to.be.revertedWithCustomError(crikz, "LPPairAlreadySet");
        });

        it("Should revert fundProductionPool if amount is zero", async function () {
            const { crikz, owner } = await loadFixture(deployFixture);
            // Using fundProductionPoolForTest helper to bypass onlyOwner for revert check
            await expect(crikz.connect(owner).fundProductionPoolForTest(0))
                .to.be.revertedWithCustomError(crikz, "InvalidAmount");
        });

        describe("emergencyOwnerWithdraw Revert Tests", function () {
            it("Should revert if called by non-owner", async function () {
                const { crikz, user1 } = await loadFixture(deployFixture);
                const amount = ethers.parseEther("100");
                await expect(crikz.connect(user1).emergencyOwnerWithdraw(amount))
                    .to.be.revertedWith("Ownable: caller is not the owner");
            });

            it("Should revert if amount is zero", async function () {
                const { crikz, owner } = await loadFixture(deployFixture);
                // Using emergencyOwnerWithdrawForTest helper to bypass onlyOwner for revert check
                await expect(crikz.connect(owner).emergencyOwnerWithdrawForTest(0))
                    .to.be.revertedWithCustomError(crikz, "InvalidAmount");
            });

            it("Should revert if contract's ERC20 balance is insufficient", async function () {
                const { crikz, owner } = await loadFixture(deployFixture);
                const amountToWithdraw = INITIAL_FUND_AMOUNT + ethers.parseEther("1");
                // Using emergencyOwnerWithdrawForTest helper to test custom revert
                await expect(crikz.connect(owner).emergencyOwnerWithdrawForTest(amountToWithdraw))
                    .to.be.revertedWithCustomError(crikz, "InsufficientBalance");
            });

            it("Should revert if requested amount exceeds productionFund balance", async function () {
                const { crikz, owner } = await loadFixture(deployFixture);
                await crikz.connect(owner).updateProductionFundBalance(ethers.parseEther("10000"));
                const amountToWithdraw = ethers.parseEther("10001");
                // Using emergencyOwnerWithdrawForTest helper to test custom revert
                await expect(crikz.connect(owner).emergencyOwnerWithdrawForTest(amountToWithdraw))
                    .to.be.revertedWithCustomError(crikz, "ExceedsProductionFund");
            });

            it("Should allow emergencyOwnerWithdraw and update balances", async function () {
                const { crikz, owner } = await loadFixture(deployFixture);
                const amountToWithdraw = ethers.parseEther("1000");

                const ownerBalanceBefore = await crikz.balanceOf(owner.address);
                const fundBalanceBefore = await crikz.getProductionFundBalance();
                
                // Using emergencyOwnerWithdrawForTest helper for successful call
                await crikz.connect(owner).emergencyOwnerWithdrawForTest(amountToWithdraw);

                const ownerBalanceAfter = await crikz.balanceOf(owner.address);
                const fundBalanceAfter = await crikz.getProductionFundBalance();
                
                expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(amountToWithdraw);
                expect(fundBalanceBefore - fundBalanceAfter).to.equal(amountToWithdraw);
            });
        });
    });

    describe("Tokenomics: Tax and Transfers", function () {
        it("Should NOT apply tax for normal wallet-to-wallet transfers (P2P)", async function () {
            const { crikz, creator, user1 } = await loadFixture(deployFixture);
            const transferAmount = ethers.parseEther("5000");

            const creatorBalanceBefore = await crikz.balanceOf(creator.address);
            const userBalanceBefore = await crikz.balanceOf(user1.address);
            
            await crikz.connect(creator).transfer(user1.address, transferAmount);

            const creatorBalanceAfter = await crikz.balanceOf(creator.address);
            const userBalanceAfter = await crikz.balanceOf(user1.address);
            
            expect(creatorBalanceBefore - creatorBalanceAfter).to.equal(transferAmount);
            expect(userBalanceAfter - userBalanceBefore).to.equal(transferAmount);
        });

        it("Should apply 1.618% tax when transferring TO the LP pair (Simulated Buy/Add Liquidity)", async function () {
            const { crikz, creator, lpPair } = await loadFixture(deployFixture);
            const amountToTransfer = ethers.parseEther("5000");
            const expectedTax = await calculateTax(amountToTransfer);
            const expectedReceived = amountToTransfer - expectedTax;
            
            const fundBalanceBefore = await crikz.getProductionFundBalance();

            await crikz.connect(creator).transfer(lpPair.address, amountToTransfer);

            const lpBalanceAfter = await crikz.balanceOf(lpPair.address);
            const fundBalanceAfter = await crikz.getProductionFundBalance();
            
            expect(lpBalanceAfter).to.equal(expectedReceived);
            expect(fundBalanceAfter - fundBalanceBefore).to.equal(expectedTax);
        });

        it("Should apply 1.618% tax when transferring FROM the LP pair (Simulated Sell/Remove Liquidity)", async function () {
            const { crikz, creator, lpPair } = await loadFixture(deployFixture);
            const amountToTransfer = ethers.parseEther("5000"); 

            // Step 1: Give LP pair tokens (taxed transfer)
            await crikz.transfer(lpPair.address, amountToTransfer);
            
            const lpBalance = await crikz.balanceOf(lpPair.address);
            const amountToUseForSend = lpBalance; 

            const expectedTax = await calculateTax(amountToUseForSend);
            const expectedReceived = amountToUseForSend - expectedTax;
            
            const fundBalanceBefore = await crikz.getProductionFundBalance();
            const creatorBalanceBefore = await crikz.balanceOf(creator.address);

            // Step 2: Transfer FROM LP pair to creator (taxed)
            await crikz.connect(lpPair).transfer(creator.address, amountToUseForSend);

            const creatorBalanceAfter = await crikz.balanceOf(creator.address);
            const fundBalanceAfter = await crikz.getProductionFundBalance();
            
            expect(creatorBalanceAfter - creatorBalanceBefore).to.closeTo(expectedReceived, 1); 
            
            expect(fundBalanceAfter - fundBalanceBefore).to.equal(expectedTax);
        });
    });

    describe("Order Management Reverts & Edge Cases", function () {
        it("Should revert createOrder if user balance is insufficient", async function () {
            const { crikz, user1 } = await loadFixture(deployFixture);
            const userBalance = await crikz.balanceOf(user1.address);
            const excessiveAmount = userBalance + ethers.parseEther("1");
            
            await expect(crikz.connect(user1).createOrder(excessiveAmount, ORDER_TYPE_0))
                .to.be.revertedWithCustomError(crikz, "InsufficientBalance");
        });

        it("Should revert createOrder if MAX_ORDERS_PER_CREATOR is reached", async function () {
            this.timeout(5000);
            const { crikz, user1 } = await loadFixture(deployFixture);
            
            await crikz.mintForTest(user1.address, TEST_ORDER_AMOUNT * BigInt(MAX_ORDERS + 1)); 

            // Orders 0 through 49
            for (let i = 0; i < MAX_ORDERS; i++) {
                await crikz.connect(user1).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            }

            // Attempt to create the 51st order (index 50)
            await expect(crikz.connect(user1).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0))
                .to.be.revertedWithCustomError(crikz, "MaxOrdersReached");
        });

        it("Should revert if order is still locked on completeOrder", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            // Create a new order (index 0)
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            
            expect(await crikz.getOrderCount(creator.address)).to.equal(1);
            
            await expect(crikz.connect(creator).completeOrder(0)) 
                .to.be.revertedWithCustomError(crikz, "OrderStillLocked");
        });

        it("Should revert if completing a non-existent order index", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            
            await time.increase(ORDER_TYPE_0_LOCK + 100);
            // No orders exist in the clean fixture, so 0 is non-existent
            await expect(crikz.connect(creator).completeOrder(0))
                .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
        });
    });
    
    describe("Yield & Expansion Edge Cases", function () {
        it("Should successfully call claimProducts when pending products is zero", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            // Create a fresh order (index 0)
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);

            const creatorBalanceBefore = await crikz.balanceOf(creator.address);
            
            // Call claimProducts to clear any accrued yield
            await crikz.connect(creator).claimProducts();

            const creatorBalanceAfter = await crikz.balanceOf(creator.address);
            const productsClaimed = creatorBalanceAfter - creatorBalanceBefore;

            expect(productsClaimed).to.be.closeTo(0n, YIELD_TOLERANCE);
        });

        it("Should revert expandOrder if no products are pending", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            
            // 1. Create a fresh order (index 0).
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            
            // 2. Advance time to accrue yield (must be a separate block/time step).
            await time.increase(100);

            // 3. Claim the yield. (Current time is T_claim)
            await crikz.connect(creator).claimProducts();

            // 4. Set the next block timestamp to the current time (T_claim). 
            //    This requires the hardhat.config.js update below.
            const nextBlockTime = await time.latest(); 
            await time.setNextBlockTimestamp(nextBlockTime); // FIXED: Removed + 1 second

            // 5. Test the revert with index 0. Should fail because pendingProducts is 0.
            await expect(crikz.connect(creator).expandOrder(0)) 
                .to.be.revertedWithCustomError(crikz, "NoPendingProducts");
        });
    });
    
    describe("View Function Data Integrity", function () {
        it("Should return correct data for getContractStats", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            
            const [
                totalTokensInProduction,
                totalActiveCreators,
                productionFundBalance,
                fundTotalReputation,
                totalProductsClaimed,
                totalProductsRestocked
            ] = await crikz.getContractStats();
            
            const expectedProductionFundBalance = INITIAL_FUND_AMOUNT;

            expect(totalTokensInProduction).to.equal(TEST_ORDER_AMOUNT);
            expect(totalActiveCreators).to.equal(1);
            expect(productionFundBalance).to.equal(expectedProductionFundBalance); 
            expect(fundTotalReputation).to.be.gt(0);
            expect(totalProductsClaimed).to.equal(0); 
            expect(totalProductsRestocked).to.equal(0);
        });
        
        it("Should return correct data for getCreatorStats", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            
            // Advance time to accrue yield
            await time.increase(100);

            // Insert a transaction (claimProducts) to force state update and debt calculation 
            // before the view function call.
            await crikz.connect(creator).claimProducts();

            const [
                totalReputation,
                yieldDebt,
                pendingProducts,
                activeOrderCount,
                totalProductsClaimed,
                totalProductsRestocked
            ] = await crikz.getCreatorStats(creator.address);
            
            expect(totalReputation).to.be.gt(0);
            expect(yieldDebt).to.be.gt(0); 
            // pendingProducts should be 0 or near-zero due to claimProducts()
            expect(pendingProducts).to.be.closeTo(0n, YIELD_TOLERANCE); 
            expect(activeOrderCount).to.equal(1);
            expect(totalProductsClaimed).to.be.gt(0); 
            expect(totalProductsRestocked).to.equal(0);
        });

        it("Should return correct order count", async function () {
            const { crikz, creator } = await loadFixture(deployFixture);
            // Create two new orders (index 0 and 1)
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            await crikz.connect(creator).createOrder(TEST_ORDER_AMOUNT, ORDER_TYPE_0);
            
            // Two new orders are active.
            expect(await crikz.getOrderCount(creator.address)).to.equal(2);
        });
        
        it("Should return correct details for a specific order type", async function () {
            const { crikz } = await loadFixture(deployFixture);
            const [lockDuration, reputationMultiplier, name] = await crikz.getOrderTypeDetails(ORDER_TYPE_0);
            
            expect(lockDuration).to.equal(ORDER_TYPE_0_LOCK);
            expect(reputationMultiplier).to.equal(ORDER_TYPE_0_MULTIPLIER);
            expect(name).to.equal(ORDER_TYPE_0_NAME);
        });
    });
});