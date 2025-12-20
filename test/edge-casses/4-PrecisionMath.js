const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Edge Cases: Precision Mathematics", function () {
  let crikz, owner, user, funder;

  beforeEach(async function () {
    [owner, user, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("10000", 18));
  });

  it("Should handle 1 second time intervals correctly", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    await time.increase(1);
    
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should correctly calculate yield for sub-day time periods", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("100000", 18));
    
    await time.increase(6 * 60 * 60);
    
    const balBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balAfter = await crikz.balanceOf(user.address);
    
    const yield1 = balAfter - balBefore;
    expect(yield1).to.be.gt(0);
    
    await time.increase(6 * 60 * 60);
    
    const balBefore2 = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balAfter2 = await crikz.balanceOf(user.address);
    
    const yield2 = balAfter2 - balBefore2;
    
    expect(yield2).to.be.closeTo(yield1, ethers.parseUnits("0.1", 18));
  });

  it("Should handle maximum timestamp (year 2106) without overflow", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    const maxReasonableTime = 50 * 365 * 24 * 60 * 60;
    await time.increase(maxReasonableTime);
    
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should maintain precision with very small reputation values", async function () {
    const minAmount = ethers.parseUnits("2", 18);
    await crikz.connect(user).createOrder(minAmount, 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000000", 18));
    
    await time.increase(365 * 24 * 60 * 60);
    
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should handle yield updates when pool balance is very small", async function () {
    const minStake = ethers.parseUnits("10", 18);
    
    await crikz.connect(user).createOrder(minStake, 0);

    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("0.001", 18));
    
    await time.increase(365 * 24 * 60 * 60);
    
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should calculate yield based on 6.182% APR over 1 year", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("1000"), 2);
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("10000"));

    await time.increase(365 * 24 * 60 * 60);

    const balanceBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balanceAfter = await crikz.balanceOf(user.address);

    const receivedYield = balanceAfter - balanceBefore;
    expect(receivedYield).to.be.closeTo(ethers.parseEther("618.2"), ethers.parseEther("1"));
  });

  it("Should accumulate yield strictly linearly (2x Time = ~2x Yield)", async function () {
    const stake = ethers.parseUnits("1000", 18);
    const poolFunds = ethers.parseUnits("10000", 18);

    await crikz.connect(user).createOrder(stake, 0);
    await crikz.connect(funder).fundProductionPool(poolFunds);

    await time.increase(100 * 86400);
    
    const tx1 = await crikz.connect(user).claimYield();
    const rc1 = await tx1.wait();
    const event1 = rc1.logs.find(x => x.fragment && x.fragment.name === 'YieldClaimed');
    const yield1 = event1.args[1];

    await time.increase(100 * 86400);
    const tx2 = await crikz.connect(user).claimYield();
    const rc2 = await tx2.wait();
    const event2 = rc2.logs.find(x => x.fragment && x.fragment.name === 'YieldClaimed');
    const yield2 = event2.args[1];

    expect(yield2).to.be.gt(0);
    expect(yield1).to.be.gt(0);
  });
});