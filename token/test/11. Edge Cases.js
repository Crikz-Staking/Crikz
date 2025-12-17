const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Advanced Edge Cases", function () {
  let crikz, owner, alice, forwarder, router;
  const decimals = 18;
  const minOrder = ethers.parseUnits("10", decimals);

  beforeEach(async function () {
    [owner, alice, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  describe("Order Management Edge Cases", function () {
    it("Should handle multiple orders with different durations correctly", async function () {
      await crikz.transfer(alice.address, ethers.parseUnits("100", decimals));
      
      await crikz.connect(alice).createOrder(minOrder, 0); // 1 day
      await crikz.connect(alice).createOrder(minOrder, 1); // 7 days

      // Fast forward 2 days
      await time.increase(2 * 24 * 60 * 60);

      // Order 0 should be unlocked, Order 1 should still be locked
      await expect(crikz.connect(alice).completeOrder(0)).to.emit(crikz, "OrderCompleted");
      await expect(crikz.connect(alice).completeOrder(0)).to.be.revertedWithCustomError(
        crikz, 
        "OrderStillLocked"
      );
    });

    it("Should revert when trying to complete a non-existent order index", async function () {
      await expect(crikz.connect(alice).completeOrder(99)).to.be.revertedWithCustomError(
        crikz,
        "InvalidOrderIndex"
      );
    });
  });

  describe("System Stability", function () {
    it("Should allow the owner to emergency pause and prevent funding", async function () {
      await crikz.pause();
      
      const amount = ethers.parseUnits("10", decimals);
      await expect(crikz.fundProductionPool(amount)).to.be.revertedWith("Pausable: paused");
      
      await crikz.unpause();
      await crikz.transfer(alice.address, amount);
      await expect(crikz.connect(alice).fundProductionPool(amount)).to.not.be.reverted;
    });

    it("Should correctly report time remaining for locked orders", async function () {
      const amount = ethers.parseUnits("10", decimals);
      await crikz.transfer(alice.address, amount);
      
      const tx = await crikz.connect(alice).createOrder(amount, 0); // 1 day (86400s)
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const startTime = BigInt(block.timestamp);

      // Simulate 1 hour passing (3600s)
      await time.increase(3600);
      
      const activeOrders = await crikz.getActiveOrders(alice.address);
      const order = activeOrders[0];
      
      const currentTime = BigInt(await time.latest());
      const duration = BigInt(order.duration);
      const start = BigInt(order.startTime);
      
      const expectedRemaining = (start + duration) - currentTime;
      
      // Verification using BigInt explicit conversion to avoid mixing types
      expect(BigInt(expectedRemaining)).to.be.closeTo(BigInt(82800), BigInt(2));
    });
  });
});