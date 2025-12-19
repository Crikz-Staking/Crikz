const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Precision and Zero States", function () {
  let crikz, owner, user, funder;

  beforeEach(async function () {
    [owner, user, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
  });

  it("Should handle yield updates when pool balance is very small", async function () {
    const minStake = ethers.parseUnits("10", 18);
    
    await crikz.connect(owner).transfer(user.address, minStake);
    await crikz.connect(user).createOrder(minStake, 0);

    // Fund the pool with a very small amount
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("0.001", 18)); 
    
    await time.increase(365 * 24 * 60 * 60);
    
    // Should not revert - the system handles small amounts gracefully
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should handle fundProductionPool calls when totalReputation is 0", async function () {
    const fundAmount = ethers.parseUnits("10", 18);
    
    await crikz.connect(owner).transfer(funder.address, fundAmount);
    
    // Funding when no orders exist should not revert 
    await expect(crikz.connect(funder).fundProductionPool(fundAmount)).to.not.be.reverted;
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(fundAmount);
  });

  it("Should revert when claiming with no pending yield", async function () {
    const minStake = ethers.parseUnits("10", 18);
    
    await crikz.connect(owner).transfer(user.address, minStake);
    await crikz.connect(user).createOrder(minStake, 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000", 18));
    
    // Try to claim immediately (no time passed, so no yield)
    await expect(crikz.connect(user).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });
});