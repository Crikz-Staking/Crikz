const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Completion", function () {
  let crikz, creator1, forwarder, router;

  beforeEach(async function () {
    [_, creator1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(creator1.address, ethers.parseEther("1000"));
  });

  it("Should complete order after lock period (5 days)", async function () {
    await crikz.connect(creator1).createOrder(ethers.parseEther("100"), 0);
    await time.increase(5 * 24 * 60 * 60);
    await expect(crikz.connect(creator1).completeOrder(0)).to.emit(crikz, "OrderCompleted");
  });
});