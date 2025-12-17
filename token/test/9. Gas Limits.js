const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Gas Limits", function () {
  let crikz, whale, forwarder, router;

  beforeEach(async function () {
    [_, whale, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(whale.address, ethers.parseEther("100000"));
    await crikz.fundProductionPool(ethers.parseEther("10000"));
  });

  it("Should handle 20 orders within gas limits", async function () {
    for(let i=0; i<20; i++) {
      await crikz.connect(whale).createOrder(ethers.parseEther("10"), 0);
    }
    await time.increase(30 * 24 * 60 * 60);
    const tx = await crikz.connect(whale).claimYield();
    const receipt = await tx.wait();
    expect(receipt.gasUsed).to.be.lt(3000000n);
  });
});