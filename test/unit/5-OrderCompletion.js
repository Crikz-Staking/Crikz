const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Unit: Order Completion", function () {
  let crikz, creator1, forwarder, router;

  beforeEach(async function () {
    [_, creator1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(creator1.address, ethers.parseEther("1000"));
  });

  describe("Order Unlocking", function () {
    it("Should complete order after lock period (5 days)", async function () {
      await crikz.connect(creator1).createOrder(ethers.parseEther("100"), 0);
      await time.increase(5 * 24 * 60 * 60);
      await expect(crikz.connect(creator1).completeOrder(0)).to.emit(crikz, "OrderCompleted");
    });

    it("Should prevent completing an order in the same block if duration is not met", async function () {
      const amount = ethers.parseEther("100");
      await crikz.connect(creator1).createOrder(amount, 0);
      await expect(
        crikz.connect(creator1).completeOrder(0)
      ).to.be.revertedWithCustomError(crikz, "OrderStillLocked");
    });

    it("Should prevent state corruption when an order is completed immediately after unlock", async function () {
      await crikz.connect(creator1).createOrder(ethers.parseEther("100"), 0);
      const duration = 5 * 24 * 60 * 60;
      
      await time.increase(duration);
      
      await expect(crikz.connect(creator1).completeOrder(0))
        .to.emit(crikz, "OrderCompleted");
    });
  });

  describe("Invalid Operations", function () {
    it("Should revert when trying to complete a non-existent order index", async function () {
      await expect(crikz.connect(creator1).completeOrder(99)).to.be.revertedWithCustomError(
        crikz,
        "InvalidOrderIndex"
      );
    });

    it("Should revert when accessing index equal to length", async function () {
      const amount = ethers.parseEther("100");
      await crikz.connect(creator1).createOrder(amount, 0);
      
      await expect(crikz.connect(creator1).completeOrder(1))
        .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
    });
  });
});