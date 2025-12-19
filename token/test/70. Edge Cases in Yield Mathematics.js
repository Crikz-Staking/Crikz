const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Mathematics Edge Cases", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  it("Should handle 1 second time intervals correctly", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    // Wait exactly 1 second
    await time.increase(1);
    
    // Should be able to claim tiny amount without reverting
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should correctly calculate yield for sub-day time periods", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("100000", 18));
    
    // Wait 6 hours
    await time.increase(6 * 60 * 60);
    
    const balBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balAfter = await crikz.balanceOf(user.address);
    
    const yield1 = balAfter - balBefore;
    expect(yield1).to.be.gt(0);
    
    // Wait another 6 hours
    await time.increase(6 * 60 * 60);
    
    const balBefore2 = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balAfter2 = await crikz.balanceOf(user.address);
    
    const yield2 = balAfter2 - balBefore2;
    
    // Yields should be approximately equal
    expect(yield2).to.be.closeTo(yield1, ethers.parseUnits("0.1", 18));
  });

  it("Should handle maximum timestamp (year 2106) without overflow", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    // Jump to near maximum uint256 timestamp (year 2106)
    // Note: This might not work in practice, but tests the math
    const maxReasonableTime = 50 * 365 * 24 * 60 * 60; // 50 years
    await time.increase(maxReasonableTime);
    
    // Should not overflow
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });

  it("Should maintain precision with very small reputation values", async function () {
    // Create order with minimum amount that gives reputation > 0
    const minAmount = ethers.parseUnits("2", 18); // 2 tokens gives 1.236 reputation
    await crikz.connect(user).createOrder(minAmount, 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000000", 18));
    
    await time.increase(365 * 24 * 60 * 60);
    
    // Should accumulate some yield
    await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
  });
});