const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Mathematical Stress Test", function () {
  let crikz, alice, forwarder, router;

  beforeEach(async function () {
    [_, alice, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should handle extreme fund-to-reputation ratios", async function () {
    await crikz.fundProductionPool(ethers.parseEther("100000000")); // 100M tokens
    await crikz.transfer(alice.address, ethers.parseEther("10"));
    await crikz.connect(alice).createOrder(ethers.parseEther("1"), 0); 

    await time.increase(365 * 24 * 60 * 60);

    const tx = await crikz.connect(alice).claimYield();
    await expect(tx).to.emit(crikz, "YieldClaimed");
  });
});