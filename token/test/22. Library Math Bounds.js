const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Library Math Deep Dive", function () {
  let crikz, owner, user, forwarder, router;

  beforeEach(async function () {
    [owner, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should return zero yield when totalReputation is zero", async function () {
    // Directly testing the calculateTimeBasedYield logic via the contract
    // When there are no orders, totalReputation is 0
    await crikz.fundProductionPool(ethers.parseEther("1000"));
    
    const fund = await crikz.productionFund();
    expect(fund.totalReputation).to.equal(0);
    
    // Attempting a claim (even if not possible) should trigger updateFund
    // and verify that math doesn't fail on 0 reputation
    await expect(crikz.connect(user).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim"); //
  });

  it("Should revert if creating an order with 0 amount", async function () {
    await expect(crikz.connect(user).createOrder(0, 0))
      .to.be.revertedWithCustomError(crikz, "InvalidAmount"); //
  });
});