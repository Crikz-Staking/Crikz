const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: Order Creation", function () {
  let crikz, creator1, forwarder, router;

  beforeEach(async function () {
    [_, creator1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
    await crikz.transfer(creator1.address, ethers.parseEther("10000"));
  });

  describe("Order Creation", function () {
    it("Should create an order and emit event with correct timestamp", async function () {
      const amount = ethers.parseEther("100");
      const tx = await crikz.connect(creator1).createOrder(amount, 0);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx).to.emit(crikz, "OrderCreated")
        .withArgs(creator1.address, amount, 0, block.timestamp);
    });

    it("Should revert when creating an order with 0 amount", async function () {
      await expect(
        crikz.connect(creator1).createOrder(0, 0)
      ).to.be.revertedWithCustomError(crikz, "InvalidAmount");
    });

    it("Should revert when creating an order with an invalid type", async function () {
      const amount = ethers.parseEther("100");
      await expect(crikz.connect(creator1).createOrder(amount, 10))
        .to.be.reverted;
    });

    it("Should handle 1 wei 'Dust' orders gracefully", async function () {
      await expect(
        crikz.connect(creator1).createOrder(1n, 0)
      ).to.not.be.reverted;

      const orders = await crikz.getActiveOrders(creator1.address);
      expect(orders.length).to.equal(1);
      expect(orders[0].amount).to.equal(1n);
    });

    it("Should revert if Order Type is invalid (Out of Range)", async function () {
      await expect(
        crikz.connect(creator1).createOrder(ethers.parseEther("100"), 7)
      ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
    });

    it("Should handle 'dust' amounts without failing", async function () {
      const dust = ethers.parseEther("1.000000000000000001");
      await expect(crikz.connect(creator1).createOrder(dust, 0)).to.not.be.reverted;
      
      const orders = await crikz.getActiveOrders(creator1.address);
      expect(orders[0].amount).to.equal(dust);
    });
  });
});