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
      { type: 0, duration: 1 * 24 * 60 * 60, name: "Prototype" },
      { type: 1, duration: 7 * 24 * 60 * 60, name: "Short Run" },
      { type: 2, duration: 30 * 24 * 60 * 60, name: "Standard Run" },
      { type: 3, duration: 90 * 24 * 60 * 60, name: "Extended Production" },
      { type: 4, duration: 180 * 24 * 60 * 60, name: "Industrial" },
      { type: 5, duration: 365 * 24 * 60 * 60, name: "Annual Contract" },
      { type: 6, duration: 730 * 24 * 60 * 60, name: "Multi-Year" }
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

  it("Should apply consistent 0.618 reputation multiplier across all tiers", async function () {
    const amount = ethers.parseUnits("1000", 18);
    const expectedRep = (amount * 618n) / 1000n;

    for (let i = 0; i <= 6; i++) {
      await crikz.connect(user).createOrder(amount, i);
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders[i].reputation).to.equal(expectedRep);
    }
  });
});