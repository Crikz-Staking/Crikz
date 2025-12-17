const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Zero State Robustness", function () {
  let crikz, funder, forwarder, router;

  beforeEach(async function () {
    [_, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("1000"));
  });

  it("Should return 0 yield accrued when totalReputation is 0", async function () {
    // Fund the pool while no orders exist
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("500"));
    
    // Attempt to update fund (manually triggered by another funding)
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));
    
    const fund = await crikz.productionFund();
    // accumulatedYieldPerReputation should still be 0 because yield cannot accrue to 0 reputation
    expect(fund.accumulatedYieldPerReputation).to.equal(0);
  });

  it("Should revert when creating an order with 0 amount", async function () {
    await expect(
      crikz.connect(funder).createOrder(0, 0)
    ).to.be.revertedWithCustomError(crikz, "InvalidAmount"); //
  });
});