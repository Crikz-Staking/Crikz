const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Claiming", function () {
  let crikz, user, funder, forwarder, router;

  beforeEach(async function () {
    [_, user, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should allow claiming yield after time passage", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
    await time.increase(30 * 24 * 60 * 60);
    await expect(crikz.connect(user).claimYield()).to.emit(crikz, "YieldClaimed");
  });
});