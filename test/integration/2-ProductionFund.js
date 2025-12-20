const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Production Fund", function () {
  let crikz, funder, forwarder, router;

  beforeEach(async function () {
    [_, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should increase fund balance", async function () {
    const amount = ethers.parseEther("1000");
    await crikz.connect(funder).fundProductionPool(amount);
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(amount);
  });

  it("Should update fund balance and timestamp on multiple fundings", async function () {
    const amount = ethers.parseEther("1000");
    
    await crikz.connect(funder).fundProductionPool(amount);
    let fund = await crikz.productionFund();
    const firstTimestamp = fund.lastUpdateTime;

    await time.increase(1);

    await crikz.connect(funder).fundProductionPool(amount);
    fund = await crikz.productionFund();
    
    expect(fund.balance).to.equal(amount * 2n);
    expect(fund.lastUpdateTime).to.be.gt(firstTimestamp);
  });

  it("Should handle fundProductionPool calls when totalReputation is 0", async function () {
    const fundAmount = ethers.parseUnits("10", 18);
    
    await expect(crikz.connect(funder).fundProductionPool(fundAmount)).to.not.be.reverted;
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(fundAmount);
  });

  it("Should freeze yield index when total reputation is zero", async function () {
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    
    let fund = await crikz.productionFund();
    const initialAYPR = fund.accumulatedYieldPerReputation;
    
    await time.increase(365 * 24 * 60 * 60);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    
    fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.equal(initialAYPR);
  });
});