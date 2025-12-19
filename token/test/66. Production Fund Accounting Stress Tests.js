const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Production Fund Accounting", function () {
  let crikz, owner, users;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    users = signers.slice(1, 11); // 10 users
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    // Fund all users
    for (const user of users) {
      await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    }
  });

  it("Should maintain perfect balance between fund and distributed yield", async function () {
    const initialFund = ethers.parseUnits("50000", 18);
    await crikz.connect(owner).fundProductionPool(initialFund);
    
    // Multiple users stake
    for (let i = 0; i < 5; i++) {
      await crikz.connect(users[i]).createOrder(ethers.parseUnits("1000", 18), i % 3);
    }
    
    // Time passes
    await time.increase(100 * 24 * 60 * 60);
    
    let totalClaimed = 0n;
    
    // All users claim
    for (let i = 0; i < 5; i++) {
      const balBefore = await crikz.balanceOf(users[i].address);
      await crikz.connect(users[i]).claimYield();
      const balAfter = await crikz.balanceOf(users[i].address);
      totalClaimed += (balAfter - balBefore);
    }
    
    // Verify fund balance
    const fundAfter = await crikz.productionFund();
    const expectedBalance = initialFund - totalClaimed;
    
    expect(fundAfter.balance).to.be.closeTo(expectedBalance, ethers.parseUnits("0.001", 18));
  });

  it("Should handle concurrent funding and claiming correctly", async function () {
    // Initial funding
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    // User stakes
    await crikz.connect(users[0]).createOrder(ethers.parseUnits("5000", 18), 0);
    
    // Time passes
    await time.increase(30 * 24 * 60 * 60);
    
    // Record state before operations
    const fundBefore = await crikz.productionFund();
    
    // Additional funding
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    // User claims
    await crikz.connect(users[0]).claimYield();
    
    // Verify fund state is consistent
    const fundAfter = await crikz.productionFund();
    expect(fundAfter.lastUpdateTime).to.be.gte(fundBefore.lastUpdateTime);
    expect(fundAfter.balance).to.be.gt(0);
  });

  it("Should prevent integer overflow in accumulated yield calculation", async function () {
    // Fund with maximum safe amount
    const hugeFund = ethers.parseUnits("100000000", 18); // 100M tokens
    await crikz.connect(owner).fundProductionPool(hugeFund);
    
    // Create order with large amount
    await crikz.connect(users[0]).createOrder(ethers.parseUnits("10000", 18), 0);
    
    // Wait maximum reasonable time (10 years)
    await time.increase(10 * 365 * 24 * 60 * 60);
    
    // Should not revert on claim
    await expect(crikz.connect(users[0]).claimYield()).to.not.be.reverted;
    
    // Verify fund didn't overflow
    const fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.be.gt(0);
  });

  it("Should handle fund depletion and refunding correctly", async function () {
    // Small initial fund
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("100", 18));
    
    // User stakes large amount
    await crikz.connect(users[0]).createOrder(ethers.parseUnits("10000", 18), 4);
    
    // Wait long time to deplete fund
    await time.increase(50 * 365 * 24 * 60 * 60);
    
    // Claim should deplete fund
    await crikz.connect(users[0]).claimYield();
    let fund = await crikz.productionFund();
    expect(fund.balance).to.be.lt(ethers.parseUnits("0.1", 18));
    
    // Refund
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000", 18));
    fund = await crikz.productionFund();
    expect(fund.balance).to.be.closeTo(ethers.parseUnits("1000", 18), ethers.parseUnits("0.1", 18));
    
    // Wait and claim again
    await time.increase(30 * 24 * 60 * 60);
    await expect(crikz.connect(users[0]).claimYield()).to.not.be.reverted;
  });
});