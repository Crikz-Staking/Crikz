const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Edge Cases: Array Boundaries", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  describe("Single Order Scenarios", function () {
    it("Should handle removal of the only order", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      await crikz.connect(user).completeOrder(0);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(0);
    });

    it("Should handle getting orders when array is empty", async function () {
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(0);
    });
  });

  describe("Last Element Removal", function () {
    it("Should correctly handle removal of last element", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove last element (index 2)
      await crikz.connect(user).completeOrder(2);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      expect(orders[0].amount).to.equal(ethers.parseEther("100"));
      expect(orders[1].amount).to.equal(ethers.parseEther("200"));
    });
  });

  describe("First Element Removal", function () {
    it("Should correctly swap last to first when removing first element", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove first element (index 0)
      await crikz.connect(user).completeOrder(0);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(2);
      // Last element (300) should now be at index 0
      expect(orders[0].amount).to.equal(ethers.parseEther("300"));
      expect(orders[1].amount).to.equal(ethers.parseEther("200"));
    });
  });

  describe("Sequential Removals", function () {
    it("Should handle removing all orders sequentially", async function () {
      for (let i = 0; i < 5; i++) {
        await crikz.connect(user).createOrder(ethers.parseEther(`${(i + 1) * 100}`), 0);
      }
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove all orders
      for (let i = 0; i < 5; i++) {
        await crikz.connect(user).completeOrder(0);
      }
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(0);
    });

    it("Should maintain data integrity through multiple removals", async function () {
      const amounts = [100, 200, 300, 400, 500];
      
      for (const amount of amounts) {
        await crikz.connect(user).createOrder(ethers.parseEther(amount.toString()), 0);
      }
      
      await time.increase(6 * 24 * 60 * 60);
      
      // Remove middle elements
      await crikz.connect(user).completeOrder(2); // Remove 300
      await crikz.connect(user).completeOrder(1); // Remove 200
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(3);
    });
  });

  describe("Invalid Index Access", function () {
    it("Should revert on index equal to length", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      await expect(crikz.connect(user).completeOrder(1))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });

    it("Should revert on index greater than length", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(6 * 24 * 60 * 60);
      
      await expect(crikz.connect(user).completeOrder(99))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });

    it("Should revert when accessing empty array", async function () {
      await time.increase(6 * 24 * 60 * 60);
      
      await expect(crikz.connect(user).completeOrder(0))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });
  });
});