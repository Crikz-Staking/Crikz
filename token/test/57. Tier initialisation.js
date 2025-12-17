const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Tier Configuration", function () {
  it("Should initialize all 7 order types with correct durations", async function () {
    const [owner] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(owner.address, owner.address);

    // Tier 0: 1 day (86400s)
    const tier0 = await crikz.orderTypes(0);
    expect(tier0.duration).to.equal(86400n);

    // Tier 1: 7 days (604800s)
    const tier1 = await crikz.orderTypes(1);
    expect(tier1.duration).to.equal(604800n);

    // Verify the MAX_ORDER_TYPE boundary
    await expect(crikz.orderTypes(7)).to.be.reverted;
  });
});