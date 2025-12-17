const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Order Creation", function () {
  let crikz, creator1, forwarder, router;

  beforeEach(async function () {
    [_, creator1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
    await crikz.transfer(creator1.address, ethers.parseEther("10000"));
  });

  it("Should create an order and emit event with correct timestamp", async function () {
    const amount = ethers.parseEther("100");
    const tx = await crikz.connect(creator1).createOrder(amount, 0);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    await expect(tx).to.emit(crikz, "OrderCreated")
      .withArgs(creator1.address, amount, 0, block.timestamp);
  });
});