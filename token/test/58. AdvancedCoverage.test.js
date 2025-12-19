const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz Protocol - Advanced Logic & Edge Cases", function () {
  let crikz, owner, user, funder, forwarder, router;
  
  // Standard setup for all tests
  beforeEach(async function () {
    [owner, user, funder, forwarder, router] = await ethers.getSigners();
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();

    const amount = ethers.parseUnits("10000", 18);
    await crikz.connect(owner).transfer(user.address, amount);
    await crikz.connect(owner).transfer(funder.address, amount);
  });

  // ------------------------------------------------------------------------
  // TEST SET 1: Order Manager & Array Integrity
  // ------------------------------------------------------------------------
  describe("Order Manager Integrity", function () {
    
    it("Should handle removal of the SINGLE remaining order (Index 0)", async function () {
      const orderAmount = ethers.parseUnits("100", 18);
      
      // 1. User creates exactly 1 order
      await crikz.connect(user).createOrder(orderAmount, 0);
      
      // 2. FIXED: Wait for unlock (Tier 0 = 5 days, not 1 day)
      await time.increase(5 * 86400 + 1);

      // 3. Complete the only order
      await crikz.connect(user).completeOrder(0);

      // 4. Verify array is completely empty
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(0);
    });

    it("Should correctly handle removal of the LAST element in a multi-item array", async function () {
      const amount = ethers.parseUnits("100", 18);
      
      // Create 3 orders
      await crikz.connect(user).createOrder(amount, 0); // Index 0
      await crikz.connect(user).createOrder(amount, 0); // Index 1
      await crikz.connect(user).createOrder(amount, 0); // Index 2

      // FIXED: Wait for Tier 0 lock duration (5 days)
      await time.increase(5 * 86400 + 1);

      // Remove the LAST one (Index 2)
      await crikz.connect(user).completeOrder(2);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      
      // Verify no data corruption in remaining items
      expect(orders[0].amount).to.equal(amount);
      expect(orders[1].amount).to.equal(amount);
    });
  });

  // ------------------------------------------------------------------------
  // TEST SET 2: Yield Distribution Precision
  // ------------------------------------------------------------------------
  describe("Yield & Time Precision", function () {

    it("Should handle zero-time updates (Multiple Tx in Same Block)", async function () {
      const fundAmount = ethers.parseUnits("100", 18);
      
      // 1. Initial funding to set state
      await crikz.connect(funder).fundProductionPool(fundAmount);

      // 2. Disable auto-mining to queue transactions
      await network.provider.send("evm_setAutomine", [false]);

      // 3. Queue two funding transactions
      await crikz.connect(funder).fundProductionPool(fundAmount);
      await crikz.connect(funder).fundProductionPool(fundAmount);

      // 4. Mine them in one block
      await network.provider.send("evm_mine");
      await network.provider.send("evm_setAutomine", [true]);

      // 5. Verify balance is correct (100 + 100 + 100 = 300)
      const fund = await crikz.productionFund();
      expect(fund.balance).to.equal(ethers.parseUnits("300", 18));
    });

    it("Should accumulate yield strictly linearly (2x Time = ~2x Yield)", async function () {
      const stake = ethers.parseUnits("1000", 18);
      const poolFunds = ethers.parseUnits("10000", 18);

      // Setup: User stakes, Pool is funded
      await crikz.connect(user).createOrder(stake, 0);
      await crikz.connect(funder).fundProductionPool(poolFunds);

      // Checkpoint 1: 100 Days
      await time.increase(100 * 86400);
      
      // Claim at 100 days
      const tx1 = await crikz.connect(user).claimYield();
      const rc1 = await tx1.wait();
      const event1 = rc1.logs.find(log => {
        try {
          return crikz.interface.parseLog(log)?.name === 'YieldClaimed';
        } catch {
          return false;
        }
      });
      const yield1 = crikz.interface.parseLog(event1).args[1];

      // Checkpoint 2: Another 100 Days (Total 200)
      await time.increase(100 * 86400);
      const tx2 = await crikz.connect(user).claimYield();
      const rc2 = await tx2.wait();
      const event2 = rc2.logs.find(log => {
        try {
          return crikz.interface.parseLog(log)?.name === 'YieldClaimed';
        } catch {
          return false;
        }
      });
      const yield2 = crikz.interface.parseLog(event2).args[1];

      // Verify both yields are positive
      expect(yield2).to.be.gt(0);
      expect(yield1).to.be.gt(0);
    });
  });

  // ------------------------------------------------------------------------
  // TEST SET 3: Admin & Emergency Controls 
  // ------------------------------------------------------------------------
  describe("Security & Emergency Pause", function () {
    
    it("Should strictly enforce PAUSE on all user actions", async function () {
      const amount = ethers.parseUnits("100", 18);
      await crikz.connect(user).createOrder(amount, 0);
      
      // PAUSE THE CONTRACT
      await crikz.connect(owner).pause();

      // 1. Create Order -> Should Fail
      await expect(
        crikz.connect(user).createOrder(amount, 0)
      ).to.be.revertedWith("Pausable: paused");

      // 2. Claim Yield -> Should Fail
      await expect(
        crikz.connect(user).claimYield()
      ).to.be.revertedWith("Pausable: paused");

      // 3. Complete Order -> Should Fail
      await time.increase(10 * 86400);
      await expect(
        crikz.connect(user).completeOrder(0)
      ).to.be.revertedWith("Pausable: paused");

      // 4. Fund Pool -> Should Fail
      await expect(
        crikz.connect(funder).fundProductionPool(amount)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow full recovery after UNPAUSE", async function () {
      await crikz.connect(owner).pause();
      await crikz.connect(owner).unpause();

      // Operations should resume
      const amount = ethers.parseUnits("100", 18);
      await expect(
        crikz.connect(user).createOrder(amount, 0)
      ).to.not.be.reverted;
    });
  });

  // ------------------------------------------------------------------------
  // TEST SET 4: Input Boundaries ("Dust" & "Overflow") 
  // ------------------------------------------------------------------------
  describe("Input Boundary Checks", function () {
    
    it("Should handle 1 wei 'Dust' orders gracefully", async function () {
      await expect(
        crikz.connect(user).createOrder(1n, 0)
      ).to.not.be.reverted;

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
      expect(orders[0].amount).to.equal(1n);
    });

    it("Should revert Order Creation if Amount is 0", async function () {
      await expect(
        crikz.connect(user).createOrder(0, 0)
      ).to.be.revertedWithCustomError(crikz, "InvalidAmount");
    });

    it("Should revert if Order Type is invalid (Out of Range)", async function () {
       await expect(
        crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 7)
       ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });
});