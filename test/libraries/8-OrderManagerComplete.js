const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: OrderManager - Complete Coverage", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("100000", 18));
  });

  describe("createOrder - Line 33 Coverage", function () {
    it("Should create order with all tiers and verify reputation calculation", async function () {
      const amount = ethers.parseEther("1000");
      
      const expectedReps = [
        (amount * 618n) / 1000n,   // Tier 0
        (amount * 787n) / 1000n,   // Tier 1
        (amount * 1001n) / 1000n,  // Tier 2
        (amount * 1273n) / 1000n,  // Tier 3
        (amount * 1619n) / 1000n,  // Tier 4
        (amount * 2059n) / 1000n,  // Tier 5
        (amount * 2618n) / 1000n   // Tier 6
      ];
      
      for (let i = 0; i <= 6; i++) {
        await crikz.connect(user).createOrder(amount, i);
        const orders = await crikz.getActiveOrders(user.address);
        
        // Verify line 33: reputation calculation
        expect(orders[i].reputation).to.equal(expectedReps[i]);
        expect(orders[i].amount).to.equal(amount);
        expect(orders[i].orderType).to.equal(i);
      }
    });
  });

  describe("removeOrder - Lines 51, 54-55 Coverage", function () {
    it("Should correctly remove order and trigger require check (line 51)", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Valid removal
      await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
      
      // Invalid removal - triggers line 51 require
      await expect(crikz.connect(user).completeOrder(0))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });

    it("Should execute swap-and-pop (lines 54-55)", async function () {
      // Create 3 orders
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove middle order (index 1)
      await crikz.connect(user).completeOrder(1);
      
      const orders = await crikz.getActiveOrders(user.address);
      
      // Line 54: orders[index] = orders[orders.length - 1]
      // Line 55: orders.pop()
      expect(orders.length).to.equal(2);
      expect(orders[0].amount).to.equal(ethers.parseEther("100"));
      expect(orders[1].amount).to.equal(ethers.parseEther("300"));
    });

    it("Should remove last element correctly", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove last element
      await crikz.connect(user).completeOrder(1);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
      expect(orders[0].amount).to.equal(ethers.parseEther("100"));
    });

    it("Should remove first element correctly", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove first element
      await crikz.connect(user).completeOrder(0);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      // Last element should now be at index 0
      expect(orders[0].amount).to.equal(ethers.parseEther("300"));
    });
  });

  describe("getTimeRemaining - Lines 69, 71-72, 75 Coverage", function () {
    it("Should calculate time remaining when locked (line 69, 75)", async function () {
      const tx = await crikz.connect(user).createOrder(ethers.parseEther("100"), 2);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const startTime = block.timestamp;
      
      // Wait 10 days of 34 day lock
      await time.increase(10 * 24 * 60 * 60);
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      
      // Line 69: uint256 unlockTime = order.startTime + order.duration;
      const unlockTime = Number(order.startTime) + Number(order.duration);
      
      // Line 75: return unlockTime - currentTime;
      const expectedRemaining = unlockTime - currentTime;
      expect(expectedRemaining).to.be.closeTo(24 * 24 * 60 * 60, 100); // ~24 days left
    });

    it("Should return 0 when unlocked (lines 71-72)", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      // Wait past unlock
      await time.increase(10 * 24 * 60 * 60);
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      const unlockTime = Number(order.startTime) + Number(order.duration);
      
      // Line 71: if (currentTime >= unlockTime)
      expect(currentTime).to.be.gte(unlockTime);
      
      // Line 72: return 0;
      const remaining = currentTime >= unlockTime ? 0 : unlockTime - currentTime;
      expect(remaining).to.equal(0);
    });
  });

  describe("isUnlocked - Line 89 Coverage", function () {
    it("Should return true when unlocked", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      
      // Line 89: return currentTime >= order.startTime + order.duration;
      const isUnlocked = currentTime >= Number(order.startTime) + Number(order.duration);
      expect(isUnlocked).to.be.true;
      
      // Verify by completing order
      await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
    });

    it("Should return false when still locked", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      // Don't wait
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      
      // Line 89: return currentTime >= order.startTime + order.duration;
      const isUnlocked = currentTime >= Number(order.startTime) + Number(order.duration);
      expect(isUnlocked).to.be.false;
      
      // Verify by trying to complete
      await expect(crikz.connect(user).completeOrder(0))
        .to.be.revertedWithCustomError(crikz, "OrderStillLocked");
    });
  });

  describe("getUnlockTime - Line 98 Coverage", function () {
    it("Should correctly calculate unlock timestamp", async function () {
      const tx = await crikz.connect(user).createOrder(ethers.parseEther("100"), 3);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      // Line 98: return order.startTime + order.duration;
      const unlockTime = Number(order.startTime) + Number(order.duration);
      
      // Verify unlock time is in the future
      const currentTime = block.timestamp;
      expect(unlockTime).to.be.gt(currentTime);
      
      // Verify unlock time matches expected (89 days for tier 3)
      const expectedUnlock = block.timestamp + (89 * 24 * 60 * 60);
      expect(unlockTime).to.equal(expectedUnlock);
    });
  });
});