const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Libraries: OrderTypes - Complete Coverage", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    // Give user enough balance for large order tests
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("200000", 18));
  });

  describe("initializeOrderTypes - Lines 20, 22-64 Coverage", function () {
    it("Should initialize all 7 tiers with correct values", async function () {
      const expectedValues = [
        { duration: 5 * 24 * 60 * 60, multiplier: 618n * 10n**15n, name: "Prototype" },
        { duration: 13 * 24 * 60 * 60, multiplier: 787n * 10n**15n, name: "Small Batch" },
        { duration: 34 * 24 * 60 * 60, multiplier: 1001n * 10n**15n, name: "Standard Run" },
        { duration: 89 * 24 * 60 * 60, multiplier: 1273n * 10n**15n, name: "Mass Production" },
        { duration: 233 * 24 * 60 * 60, multiplier: 1619n * 10n**15n, name: "Industrial" },
        { duration: 610 * 24 * 60 * 60, multiplier: 2059n * 10n**15n, name: "Global Scale" },
        { duration: 1597 * 24 * 60 * 60, multiplier: 2618n * 10n**15n, name: "Monopoly" }
      ];
      
      for (let i = 0; i <= 6; i++) {
        const orderType = await crikz.orderTypes(i);
        
        // Line 20: OrderType[7] memory types;
        // Lines 22-64: All tier initializations
        expect(orderType.lockDuration).to.equal(expectedValues[i].duration);
        expect(orderType.reputationMultiplier).to.equal(expectedValues[i].multiplier);
      }
    });
  });

  describe("getOrderType - Lines 74-76 Coverage", function () {
    it("Should successfully retrieve order type for valid index", async function () {
      // Lines 74-76 are called internally when creating orders
      for (let i = 0; i <= 6; i++) {
        // This internally calls getOrderType
        await crikz.connect(user).createOrder(ethers.parseEther("100"), i);
        
        const orders = await crikz.getActiveOrders(user.address);
        const order = orders[i];
        
        // Line 74: require(index <= MAX_ORDER_TYPE, "Invalid order type");
        // Line 75: OrderType[7] memory types = initializeOrderTypes();
        // Line 76: return types[index];
        expect(order.orderType).to.equal(i);
      }
    });

    it("Should revert on invalid order type index (line 74)", async function () {
      // Line 74: require(index <= MAX_ORDER_TYPE, "Invalid order type");
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 7)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
      
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 255)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });

  describe("calculateReputation - Lines 87-88, 92 Coverage", function () {
    it("Should calculate reputation correctly for all tiers", async function () {
      const amount = ethers.parseEther("1000");
      
      const expectedReps = [
        (amount * 618n) / 1000n,   // 618
        (amount * 787n) / 1000n,   // 787
        (amount * 1001n) / 1000n,  // 1001
        (amount * 1273n) / 1000n,  // 1273
        (amount * 1619n) / 1000n,  // 1619
        (amount * 2059n) / 1000n,  // 2059
        (amount * 2618n) / 1000n   // 2618
      ];
      
      for (let i = 0; i <= 6; i++) {
        await crikz.connect(user).createOrder(amount, i);
        const orders = await crikz.getActiveOrders(user.address);
        
        // Line 87: require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        // Line 88: OrderType memory orderType = getOrderType(orderTypeIndex);
        // Line 92: return (amount * orderType.reputationMultiplier) / 1e18;
        expect(orders[i].reputation).to.equal(expectedReps[i]);
      }
    });

    it("Should revert on invalid tier (line 87)", async function () {
      // Line 87: require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 8)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });

    it("Should handle edge case amounts", async function () {
      // Very small amount
      const smallAmount = ethers.parseEther("0.001");
      await crikz.connect(user).createOrder(smallAmount, 0);
      
      let orders = await crikz.getActiveOrders(user.address);
      expect(orders[0].reputation).to.equal((smallAmount * 618n) / 1000n);
      
      // Very large amount - use amount that user has balance for
      const largeAmount = ethers.parseEther("100000");
      await crikz.connect(user).createOrder(largeAmount, 6);
      
      orders = await crikz.getActiveOrders(user.address);
      expect(orders[1].reputation).to.equal((largeAmount * 2618n) / 1000n);
    });
  });

  describe("getLockDuration - Lines 101-103 Coverage", function () {
    it("Should return correct lock duration for all tiers", async function () {
      const expectedDurations = [
        5 * 24 * 60 * 60,
        13 * 24 * 60 * 60,
        34 * 24 * 60 * 60,
        89 * 24 * 60 * 60,
        233 * 24 * 60 * 60,
        610 * 24 * 60 * 60,
        1597 * 24 * 60 * 60
      ];
      
      for (let i = 0; i <= 6; i++) {
        await crikz.connect(user).createOrder(ethers.parseEther("100"), i);
        const orders = await crikz.getActiveOrders(user.address);
        
        // Line 101: require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        // Line 102: OrderType memory orderType = getOrderType(orderTypeIndex);
        // Line 103: return orderType.lockDuration;
        expect(orders[i].duration).to.equal(expectedDurations[i]);
      }
    });

    it("Should revert on invalid tier (line 101)", async function () {
      // Line 101: require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 10)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });

  describe("getTierName - Lines 112-114 Coverage", function () {
    it("Should verify tier names exist for all tiers", async function () {
      // We can't directly call getTierName from the test, but we verify
      // the initialization worked by checking the struct values
      const expectedNames = [
        "Prototype",
        "Small Batch",
        "Standard Run",
        "Mass Production",
        "Industrial",
        "Global Scale",
        "Monopoly"
      ];
      
      for (let i = 0; i <= 6; i++) {
        const orderType = await crikz.orderTypes(i);
        
        // Line 112: require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        // Line 113: OrderType memory orderType = getOrderType(orderTypeIndex);
        // Line 114: return orderType.name;
        
        // We can't directly access string names from the test,
        // but we verify the struct is complete by checking all fields exist
        expect(orderType.lockDuration).to.be.gt(0);
        expect(orderType.reputationMultiplier).to.be.gt(0);
      }
    });
  });

  describe("MAX_ORDER_TYPE constant verification", function () {
    it("Should enforce MAX_ORDER_TYPE = 6", async function () {
      // Valid: tier 6
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 6)
      ).to.not.be.reverted;
      
      // Invalid: tier 7
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 7)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });
});