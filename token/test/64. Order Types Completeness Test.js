const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Complete Order Types Coverage", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("100000", 18));
  });

  it("Should enforce correct lock durations for all 7 order types", async function () {
    const orderTypeData = [
      { type: 0, duration: 5 * 24 * 60 * 60, name: "Prototype" },
      { type: 1, duration: 13 * 24 * 60 * 60, name: "Small Batch" },
      { type: 2, duration: 34 * 24 * 60 * 60, name: "Standard Run" },
      { type: 3, duration: 89 * 24 * 60 * 60, name: "Mass Production" },
      { type: 4, duration: 233 * 24 * 60 * 60, name: "Industrial" },
      { type: 5, duration: 610 * 24 * 60 * 60, name: "Global Scale" },
      { type: 6, duration: 1597 * 24 * 60 * 60, name: "Monopoly" }
    ];

    for (let i = 0; i < orderTypeData.length; i++) {
      const orderData = orderTypeData[i];
      const amount = ethers.parseUnits("1000", 18);
      
      // Create order
      await crikz.connect(user).createOrder(amount, orderData.type);
      
      const orders = await crikz.getActiveOrders(user.address);
      const currentOrder = orders[i]; // Get the i-th order (not last, since we're accumulating)
      
      // Verify duration matches
      expect(currentOrder.duration).to.equal(orderData.duration, 
        `${orderData.name} should have duration ${orderData.duration}`);
      
      console.log(`      ✓ ${orderData.name}: ${orderData.duration}s verified`);
    }
    
    // Now test completion timing for first order (shortest duration)
    const orders = await crikz.getActiveOrders(user.address);
    
    // Try to complete order 0 before duration - should fail
    await expect(crikz.connect(user).completeOrder(0))
      .to.be.revertedWithCustomError(crikz, "OrderStillLocked");
    
    // Wait for order 0 duration to pass
    await time.increase(orderTypeData[0].duration + 1);
    
    // Complete order 0 - should succeed
    await expect(crikz.connect(user).completeOrder(0))
      .to.emit(crikz, "OrderCompleted");
  });

  it("Should apply correct tier-specific reputation multipliers", async function () {
    const amount = ethers.parseUnits("1000", 18);
    
    // Define expected multipliers for each tier
    const multipliers = [
      618n * 10n**15n,   // Tier 0: 0.618x
      787n * 10n**15n,   // Tier 1: 0.787x
      1001n * 10n**15n,  // Tier 2: 1.001x
      1273n * 10n**15n,  // Tier 3: 1.273x
      1619n * 10n**15n,  // Tier 4: 1.619x
      2059n * 10n**15n,  // Tier 5: 2.059x
      2618n * 10n**15n   // Tier 6: 2.618x
    ];

    for (let i = 0; i <= 6; i++) {
      await crikz.connect(user).createOrder(amount, i);
      const orders = await crikz.getActiveOrders(user.address);
      
      // Calculate expected reputation for this tier
      const expectedRep = (amount * multipliers[i]) / 10n**18n;
      
      expect(orders[i].reputation).to.equal(expectedRep,
        `Tier ${i} should have reputation ${expectedRep}`);
    }
  });

  it("Should verify total reputation accumulates correctly across tiers", async function () {
    const amount = ethers.parseUnits("1000", 18);
    
    const multipliers = [
      618n * 10n**15n,   // Tier 0
      787n * 10n**15n,   // Tier 1
      1001n * 10n**15n,  // Tier 2
      1273n * 10n**15n,  // Tier 3
      1619n * 10n**15n,  // Tier 4
      2059n * 10n**15n,  // Tier 5
      2618n * 10n**15n   // Tier 6
    ];

    let expectedTotalRep = 0n;

    for (let i = 0; i <= 6; i++) {
      await crikz.connect(user).createOrder(amount, i);
      expectedTotalRep += (amount * multipliers[i]) / 10n**18n;
    }

    const fund = await crikz.productionFund();
    expect(fund.totalReputation).to.equal(expectedTotalRep,
      "Total reputation should match sum of all tier reputations");
  });
});