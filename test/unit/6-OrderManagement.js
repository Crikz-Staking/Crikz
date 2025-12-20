const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Unit: Order Management", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("10000"));
  });

  describe("Array Management (Swap-and-Pop)", function () {
    it("Should correctly maintain order array via swap-and-pop", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 1);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 2);

      await time.increase(15 * 24 * 60 * 60);

      await crikz.connect(user).completeOrder(1);

      const activeOrders = await crikz.getActiveOrders(user.address);
      expect(activeOrders.length).to.equal(2);
      expect(activeOrders[1].amount).to.equal(ethers.parseEther("300"));
      expect(activeOrders[0].amount).to.equal(ethers.parseEther("100"));
    });

    it("Should maintain correct indices after removing a middle order", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);

      await time.increase(6 * 24 * 60 * 60);

      await crikz.connect(user).completeOrder(1);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      expect(orders[0].amount).to.equal(ethers.parseEther("100"));
      expect(orders[1].amount).to.equal(ethers.parseEther("300"));
    });

    it("Should handle removal of the final order in the array correctly", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);

      await time.increase(6 * 24 * 60 * 60);

      await crikz.connect(user).completeOrder(1);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
      expect(orders[0].amount).to.equal(ethers.parseEther("100"));
    });

    it("Should maintain state integrity after middle-array deletions", async function () {
      const MIN_STAKE = ethers.parseUnits("10", 18);
      
      await crikz.connect(user).createOrder(MIN_STAKE, 0);
      await crikz.connect(user).createOrder(MIN_STAKE * 2n, 1);
      await crikz.connect(user).createOrder(MIN_STAKE * 3n, 2);

      await time.increase(31 * 24 * 60 * 60);

      await crikz.connect(user).completeOrder(1);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      expect(orders[1].amount).to.equal(MIN_STAKE * 3n);
    });

    it("Should maintain order integrity across multiple removals", async function () {
      const amounts = [100, 200, 300, 400, 500];
      for (let a of amounts) {
        await crikz.connect(user).createOrder(ethers.parseEther(a.toString()), 0);
      }

      await time.increase(6 * 24 * 60 * 60);

      await crikz.connect(user).completeOrder(2);

      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(4);
      expect(orders[2].amount).to.equal(ethers.parseEther("500"));
      
      await crikz.connect(user).completeOrder(0);
      
      const remaining = await crikz.getActiveOrders(user.address);
      expect(remaining.length).to.equal(3);
      expect(remaining[0].amount).to.equal(ethers.parseEther("400"));
    });
  });

  describe("Multiple Orders with Different Durations", function () {
    it("Should handle multiple orders with different durations correctly", async function () {
      const amount = ethers.parseUnits("100", 18);
      
      await crikz.connect(user).createOrder(amount, 0); // 5 days
      await crikz.connect(user).createOrder(amount, 1); // 13 days

      await time.increase(6 * 24 * 60 * 60);

      await expect(crikz.connect(user).completeOrder(0)).to.emit(crikz, "OrderCompleted");
      await expect(crikz.connect(user).completeOrder(0)).to.be.revertedWithCustomError(
        crikz,
        "OrderStillLocked"
      );
    });
  });
});