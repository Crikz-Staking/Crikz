const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Debt Manipulation Resistance", function () {
  let crikz, owner, alice, bob, attacker;

  beforeEach(async function () {
    [owner, alice, bob, attacker] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(bob.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("100000", 18));
  });

  it("Should prevent front-running yield claims through flash staking", async function () {
    // Scenario: Alice stakes, time passes, attacker tries to front-run her claim
    
    // 1. Alice stakes legitimately
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    // 2. Time passes - Alice accumulates yield
    await time.increase(100 * 24 * 60 * 60);
    
    // 3. Attacker sees Alice's pending transaction and stakes a huge amount
    await crikz.connect(attacker).createOrder(ethers.parseUnits("50000", 18), 0);
    
    // 4. Both claim in same block (attacker first due to gas price)
    const aliceDebtBefore = await crikz.creatorYieldDebt(alice.address);
    const attackerDebtBefore = await crikz.creatorYieldDebt(attacker.address);
    
    const aliceBalBefore = await crikz.balanceOf(alice.address);
    const attackerBalBefore = await crikz.balanceOf(attacker.address);
    
    // Attacker tries to claim immediately
    await expect(crikz.connect(attacker).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
    
    // Alice should be able to claim her accumulated yield
    await crikz.connect(alice).claimYield();
    const aliceBalAfter = await crikz.balanceOf(alice.address);
    
    // Alice should have significant yield
    expect(aliceBalAfter).to.be.gt(aliceBalBefore);
  });

  it("Should correctly handle yield debt when user creates multiple orders at different times", async function () {
    // Create initial order
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    // Wait and accumulate yield
    await time.increase(30 * 24 * 60 * 60);
    
    // Create second order - should snapshot debt correctly
    const debtBefore = await crikz.creatorYieldDebt(alice.address);
    await crikz.connect(alice).createOrder(ethers.parseUnits("2000", 18), 0);
    const debtAfter = await crikz.creatorYieldDebt(alice.address);
    
    // Debt should be updated to reflect new total reputation
    expect(debtAfter).to.be.gt(debtBefore);
    
    // Wait more time
    await time.increase(30 * 24 * 60 * 60);
    
    // Claim yield - should work correctly
    await expect(crikz.connect(alice).claimYield()).to.not.be.reverted;
  });

  it("Should maintain debt integrity across order completions", async function () {
    // Create 3 orders at different times
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    await time.increase(10 * 24 * 60 * 60);
    await crikz.connect(alice).createOrder(ethers.parseUnits("2000", 18), 0);
    
    await time.increase(10 * 24 * 60 * 60);
    await crikz.connect(alice).createOrder(ethers.parseUnits("3000", 18), 0);
    
    await time.increase(10 * 24 * 60 * 60);
    
    // Complete middle order
    await crikz.connect(alice).completeOrder(1);
    
    // Verify debt is still correct
    const totalRep = await crikz.totalCreatorReputation(alice.address);
    const fund = await crikz.productionFund();
    const expectedDebt = (totalRep * fund.accumulatedYieldPerReputation) / ethers.parseUnits("1", 18);
    const actualDebt = await crikz.creatorYieldDebt(alice.address);
    
    expect(actualDebt).to.equal(expectedDebt);
  });
});