const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Math Revert Paths", function () {
  let crikz, owner, forwarder, router;

  beforeEach(async function () {
    [owner, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should revert if creating an order with 0 amount (CrikzMath: InvalidAmount)", async function () {
    // This hits the 'if (amount == 0) revert InvalidAmount()' in the library
    await expect(
      crikz.createOrder(0, 0)
    ).to.be.reverted; 
  });

  it("Should return zero yield if totalReputation is zero (CrikzMath branch coverage)", async function () {
    // Manually setting fund state without active orders
    const lastUpdate = (await ethers.provider.getBlock('latest')).timestamp;
    await crikz.setProductionFundForTest(ethers.parseEther("1000"), 0, lastUpdate, 0);
    
    // Even after time passes, yield should remain 0 because totalRep is 0
    await ethers.provider.send("evm_increaseTime", [3600]);
    await crikz.fundProductionPool(ethers.parseEther("1")); // Triggers updateFund
    
    const fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.equal(0);
  });
});