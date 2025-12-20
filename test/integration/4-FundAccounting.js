const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Fund Accounting", function () {
  let crikz, owner, users;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    users = signers.slice(1, 11);
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    
    for (const user of users) {
      await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    }
  });

  it("Should maintain perfect balance between fund and distributed yield", async function () {
    const initialFund = ethers.parseUnits("50000", 18);
    await crikz.connect(owner).fundProductionPool(initialFund);
    
    for (let i = 0; i < 5; i++) {
      await crikz.connect(users[i]).createOrder(ethers.parseUnits("1000", 18), i % 3);
    }
    
    await time.increase(100 * 24 * 60 * 60);
    
    let totalClaimed = 0n;
    
    for (let i = 0; i < 5; i++) {
      const balBefore = await crikz.balanceOf(users[i].address);
      await crikz.connect(users[i]).claimYield();
      const balAfter = await crikz.balanceOf(users[i].address);
      totalClaimed += (balAfter - balBefore);
    }
    
    const fundAfter = await crikz.productionFund();
    const expectedBalance = initialFund - totalClaimed;
    
    expect(fundAfter.balance).to.be.closeTo(expectedBalance, ethers.parseUnits("0.001", 18));
  });

  it("Should update fund balance and timestamp on multiple fundings", async function () {
    const amount = ethers.parseEther("1000");
    
    await crikz.connect(owner).fundProductionPool(amount);
    let fund = await crikz.productionFund();
    const firstTimestamp = fund.lastUpdateTime;

    await time.increase(1);

    await crikz.connect(owner).fundProductionPool(amount);
    fund = await crikz.productionFund();
    
    expect(fund.balance).to.equal(amount * 2n);
    expect(fund.lastUpdateTime).to.be.gt(firstTimestamp);
  });

  it("Should handle fundProductionPool calls when totalReputation is 0", async function () {
    const fundAmount = ethers.parseUnits("10", 18);
    
    await expect(crikz.connect(owner).fundProductionPool(fundAmount)).to.not.be.reverted;
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(fundAmount);
  });

  it("Should return 0 yield accrued when totalReputation is 0", async function () {
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("500"));
    
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("10"));
    
    const fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.equal(0);
  });

  it("Should freeze yield index when total reputation is zero", async function () {
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("1000"));
    
    let fund = await crikz.productionFund();
    const initialAYPR = fund.accumulatedYieldPerReputation;
    
    await time.increase(365 * 24 * 60 * 60);
    
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("1000"));
    
    fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.equal(initialAYPR);
  });
});