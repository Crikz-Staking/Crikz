const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Access Control", function () {
  let crikz, owner, addr1, forwarder, router;

  beforeEach(async function () {
    [owner, addr1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should only allow owner to pause", async function () {
    await expect(crikz.connect(addr1).pause()).to.be.reverted;
    await crikz.connect(owner).pause();
    expect(await crikz.paused()).to.be.true;
  });
});