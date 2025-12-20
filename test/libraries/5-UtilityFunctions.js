const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: Utility Functions", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  describe("CrikzMath min function", function () {
    it("Should return smaller of two values", async function () {
      // We test this indirectly through yield claiming which uses min internally
      await crikz.connect(user).createOrder(ethers.parseEther("1000"), 0);
      await crikz.connect(owner).fundProductionPool(ethers.parseEther("10"));
      
      await time.increase(100 * 365 * 24 * 60 * 60);
      
      const balBefore = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter = await crikz.balanceOf(user.address);
      
      // Should only receive ~10 tokens (fund balance), not calculated yield
      expect(balAfter - balBefore).to.be.closeTo(ethers.parseEther("10"), ethers.parseEther("0.1"));
    });
  });

  describe("OrderTypes helper functions", function () {
    it("Should validate all order type configurations", async function () {
      for (let i = 0; i <= 6; i++) {
        const orderType = await crikz.orderTypes(i);
        expect(orderType.lockDuration).to.be.gt(0);
        expect(orderType.reputationMultiplier).to.be.gt(0);
      }
    });

    it("Should revert on invalid order type index", async function () {
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 10)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });
  });

  describe("OrderManager time calculations", function () {
    it("Should calculate time remaining correctly", async function () {
      const tx = await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      const receipt = await tx.wait();
      const startBlock = await ethers.provider.getBlock(receipt.blockNumber);
      
      await time.increase(2 * 24 * 60 * 60); // 2 days
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      const unlockTime = Number(order.startTime) + Number(order.duration);
      const remaining = unlockTime - currentTime;
      
      // Should have ~3 days remaining (5 day lock - 2 days passed)
      expect(remaining).to.be.closeTo(3 * 24 * 60 * 60, 100);
    });

    it("Should return zero time remaining for unlocked orders", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60); // More than 5 day lock
      
      const orders = await crikz.getActiveOrders(user.address);
      const order = orders[0];
      
      const currentTime = await time.latest();
      const unlockTime = Number(order.startTime) + Number(order.duration);
      
      expect(currentTime).to.be.gte(unlockTime);
    });
  });

  describe("Order validation", function () {
    it("Should validate order index bounds", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Valid index
      await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
      
      // Invalid index after completion
      await expect(crikz.connect(user).completeOrder(0))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });

    it("Should validate order completion timing", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      // Try to complete immediately - should fail
      await expect(crikz.connect(user).completeOrder(0))
        .to.be.revertedWithCustomError(crikz, "OrderStillLocked");
      
      // Wait for unlock
      await time.increase(6 * 24 * 60 * 60);
      
      // Should succeed now
      await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
    });
  });

  describe("Amount validations", function () {
    it("Should reject zero amount orders", async function () {
      await expect(
        crikz.connect(user).createOrder(0, 0)
      ).to.be.revertedWithCustomError(crikz, "InvalidAmount");
    });

    it("Should accept minimum valid amounts", async function () {
      const minAmount = ethers.parseEther("0.001");
      await expect(
        crikz.connect(user).createOrder(minAmount, 0)
      ).to.not.be.reverted;
    });
  });
});