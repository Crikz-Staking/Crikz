const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Gas Optimization & Scalability", function () {
  let crikz, owner, whale;

  beforeEach(async function () {
    [owner, whale] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(whale.address, ethers.parseUnits("500000", 18));
  });

  it("Should handle 50 orders without exceeding reasonable gas limits", async function () {
    const orderCount = 50;
    
    // Create 50 orders
    for (let i = 0; i < orderCount; i++) {
      await crikz.connect(whale).createOrder(ethers.parseUnits("100", 18), i % 7);
    }
    
    // Fund pool
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("100000", 18));
    
    // Wait
    await time.increase(365 * 24 * 60 * 60);
    
    // Claim yield - should be O(1) operation
    const tx = await crikz.connect(whale).claimYield();
    const receipt = await tx.wait();
    
    console.log(`      [GAS] claimYield with 50 orders: ${receipt.gasUsed.toString()}`);
    
    // Should be under 500k gas (O(1) operation)
    expect(receipt.gasUsed).to.be.lt(500000n);
  });

  it("Should efficiently handle getActiveOrders for large arrays", async function () {
    // Create 100 orders
    for (let i = 0; i < 100; i++) {
      await crikz.connect(whale).createOrder(ethers.parseUnits("10", 18), i % 7);
    }
    
    // View call should not fail
    const orders = await crikz.getActiveOrders(whale.address);
    expect(orders.length).to.equal(100);
  });

  it("Should maintain reasonable gas for yield calculations regardless of fund size", async function () {
    // Test 1: Small fund
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000", 18));
    await crikz.connect(whale).createOrder(ethers.parseUnits("100", 18), 0);
    await time.increase(30 * 24 * 60 * 60);
    
    const tx1 = await crikz.connect(whale).claimYield();
    const receipt1 = await tx1.wait();
    const gas1 = receipt1.gasUsed;
    
    console.log(`      [GAS] Small fund claim: ${gas1.toString()}`);
    
    // Test 2: Large fund
    await crikz.connect(whale).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000000", 18));
    await time.increase(30 * 24 * 60 * 60);
    
    const tx2 = await crikz.connect(whale).claimYield();
    const receipt2 = await tx2.wait();
    const gas2 = receipt2.gasUsed;
    
    console.log(`      [GAS] Large fund claim: ${gas2.toString()}`);
    
    // Gas should be similar - both should be under 200k
    expect(gas1).to.be.lt(200000n);
    expect(gas2).to.be.lt(200000n);
    
    // Calculate percentage difference
    const gasDiff = gas2 > gas1 ? gas2 - gas1 : gas1 - gas2;
    const percentDiff = (gasDiff * 100n) / gas1;
    
    console.log(`      [GAS] Difference: ${percentDiff.toString()}%`);
    
    // Gas difference should be reasonable (within 50%)
    expect(percentDiff).to.be.lt(50n);
  });

  it("Should profile gas usage across common operations", async function () {
    const amount = ethers.parseUnits("1000", 18);
    
    // 1. Create Order
    const tx1 = await crikz.connect(whale).createOrder(amount, 2);
    const receipt1 = await tx1.wait();
    console.log(`      [GAS] createOrder: ${receipt1.gasUsed.toString()}`);
    expect(receipt1.gasUsed).to.be.lt(300000n);
    
    // 2. Fund Pool
    const tx2 = await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    const receipt2 = await tx2.wait();
    console.log(`      [GAS] fundPool: ${receipt2.gasUsed.toString()}`);
    expect(receipt2.gasUsed).to.be.lt(200000n);
    
    // 3. Claim Yield
    await time.increase(30 * 24 * 60 * 60);
    const tx3 = await crikz.connect(whale).claimYield();
    const receipt3 = await tx3.wait();
    console.log(`      [GAS] claimYield: ${receipt3.gasUsed.toString()}`);
    expect(receipt3.gasUsed).to.be.lt(200000n);
    
    // 4. Complete Order
    await time.increase(30 * 24 * 60 * 60);
    const tx4 = await crikz.connect(whale).completeOrder(0);
    const receipt4 = await tx4.wait();
    console.log(`      [GAS] completeOrder: ${receipt4.gasUsed.toString()}`);
    expect(receipt4.gasUsed).to.be.lt(200000n);
  });
});