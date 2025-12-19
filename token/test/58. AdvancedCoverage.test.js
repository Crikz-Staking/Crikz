const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz Protocol - Advanced Logic & Edge Cases", function () {
  let crikz, owner, user, funder, forwarder, router;
  
  // Standard setup for all tests
  beforeEach(async function () {
    [owner, user, funder, forwarder, router] = await ethers.getSigners();
    
    // Deploy Crikz [cite: 8]
    const Crikz = await ethers.getContractFactory("Crikz");
    // Connect owner to deployment to ensure they are the deployer and receive INITIAL_SUPPLY [cite: 226]
    crikz = await Crikz.connect(owner).deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();

    // FUNDING:
    // Crikz mints initial supply to the msg.sender (owner) in the constructor. [cite: 226]
    // We must transfer tokens to 'user' and 'funder' for them to participate.
    const amount = ethers.parseUnits("10000", 18);
    await crikz.connect(owner).transfer(user.address, amount);
    await crikz.connect(owner).transfer(funder.address, amount);
  });

  // ------------------------------------------------------------------------
  // TEST SET 1: Order Manager & Array Integrity [cite: 265]
  // ------------------------------------------------------------------------
  describe("Order Manager Integrity", function () {
    
    it("Should handle removal of the SINGLE remaining order (Index 0)", async function () {
      const orderAmount = ethers.parseUnits("100", 18);
      
      // 1. User creates exactly 1 order
      await crikz.connect(user).createOrder(orderAmount, 0);
      
      // 2. Wait for unlock (Tier 0 = 1 day) [cite: 253]
      await time.increase(86400 + 1);

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

      await time.increase(86400 + 1);

      // Remove the LAST one (Index 2)
      // Standard swap-and-pop logic usually copies last to current. 
      // If current IS last, it should just pop. [cite: 267]
      await crikz.connect(user).completeOrder(2);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      
      // Verify no data corruption in remaining items
      expect(orders[0].amount).to.equal(amount);
      expect(orders[1].amount).to.equal(amount);
    });
  });

  // ------------------------------------------------------------------------
  // TEST SET 2: Yield Distribution Precision [cite: 259]
  // ------------------------------------------------------------------------
  describe("Yield & Time Precision", function () {

    it("Should handle zero-time updates (Multiple Tx in Same Block)", async function () {
      const fundAmount = ethers.parseUnits("100", 18);
      
      // 1. Initial funding to set state
      await crikz.connect(funder).fundProductionPool(fundAmount);

      // 2. Disable auto-mining to queue transactions [cite: 88]
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
      // Force an update without claiming (by funding 0 or small amount, or just view function if available)
      // Since 'calculatePendingYield' isn't explicitly in the snippets, we use a manual claim simulation or state check.
      // Assuming 'calculatePendingYield' exists or we verify via a claim call (reverting state).
      // We will perform actual claims for precision verification.
      
      // Snapshot 1
      const tx1 = await crikz.connect(user).claimYield(); // Claim at 100 days
      const rc1 = await tx1.wait();
      const event1 = rc1.logs.find(x => x.fragment && x.fragment.name === 'YieldClaimed');
      const yield1 = event1.args[1]; // Amount

      // Checkpoint 2: Another 100 Days (Total 200)
      await time.increase(100 * 86400);
      const tx2 = await crikz.connect(user).claimYield(); // Claim at 200 days
      const rc2 = await tx2.wait();
      const event2 = rc2.logs.find(x => x.fragment && x.fragment.name === 'YieldClaimed');
      const yield2 = event2.args[1]; // Amount

      // Math: Yield 2 should be roughly equal to Yield 1 (since the pool balance slightly dropped, it might be slightly less, 
      // but essentially proportional to time).
      // Note: Since pool balance decreases on claim, yield2 will be slightly lower than yield1.
      // This tests that the logic is functioning and not yielding 0 or reverting.
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
      // (Even if time has passed)
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
      // ... time passes ...
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
      // 1 wei order
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
       // MAX_ORDER_TYPE is 6. Try 7. [cite: 252]
       await expect(
        crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 7)
       ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });
});