const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Global Index Integrity", function () {
  let crikz, funder, user, forwarder, router;

  beforeEach(async function () {
    [_, funder, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should freeze yield index when total reputation is zero", async function () {
    // 1. Fund the pool
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    
    let fund = await crikz.productionFund();
    const initialAYPR = fund.accumulatedYieldPerReputation;
    
    // 2. Advance time (no orders exist)
    await time.increase(365 * 24 * 60 * 60);
    
    // 3. Trigger an update via another funding
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    
    fund = await crikz.productionFund();
    // Index should not have increased because there was no one to earn it
    expect(fund.accumulatedYieldPerReputation).to.equal(initialAYPR);
  });
});