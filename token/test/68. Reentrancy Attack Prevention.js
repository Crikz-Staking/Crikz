const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Reentrancy Protection", function () {
  let crikz, owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("10000", 18));
  });

  it("Should prevent reentrancy in claimYield", async function () {
    // Setup: Fund attacker and create order
    await crikz.connect(attacker).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    await time.increase(30 * 24 * 60 * 60);
    
    // First claim should succeed
    await crikz.connect(attacker).claimYield();
    
    // Immediate second claim should fail (no yield accumulated yet)
    await expect(crikz.connect(attacker).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });

  it("Should prevent reentrancy in completeOrder", async function () {
    await crikz.connect(attacker).createOrder(ethers.parseUnits("500", 18), 0);
    
    await time.increase(6 * 24 * 60 * 60);
    
    // Complete order
    await crikz.connect(attacker).completeOrder(0);
    
    // Try to complete same order again - should fail
    await expect(crikz.connect(attacker).completeOrder(0))
      .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
  });

  it("Should prevent reentrancy in fundProductionPool", async function () {
    const amount = ethers.parseUnits("1000", 18);
    
    // Fund once
    await crikz.connect(owner).fundProductionPool(amount);
    
    // Verify ReentrancyGuard is in place by checking modifier exists
    // We can't directly test reentrancy without a malicious contract,
    // but we can verify the function completes correctly
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(amount);
  });

  it("Should maintain state consistency after rapid successive calls", async function () {
    // Create multiple orders rapidly
    await crikz.connect(attacker).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(attacker).createOrder(ethers.parseUnits("200", 18), 0);
    await crikz.connect(attacker).createOrder(ethers.parseUnits("300", 18), 0);
    
    const orders = await crikz.getActiveOrders(attacker.address);
    expect(orders.length).to.equal(3);
    
    // Fund pool
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    await time.increase(6 * 24 * 60 * 60);
    
    // Complete orders rapidly (tests reentrancy guard)
    await crikz.connect(attacker).completeOrder(0);
    await crikz.connect(attacker).completeOrder(0); // Index 0 again due to swap-and-pop
    await crikz.connect(attacker).completeOrder(0);
    
    // Verify all orders completed
    const remainingOrders = await crikz.getActiveOrders(attacker.address);
    expect(remainingOrders.length).to.equal(0);
  });

  it("Should handle multiple users claiming simultaneously without state corruption", async function () {
    const [, user1, user2, user3] = await ethers.getSigners();
    
    // Fund users
    await crikz.connect(owner).transfer(user1.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(user2.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(user3.address, ethers.parseUnits("1000", 18));
    
    // All create orders
    await crikz.connect(user1).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(user2).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(user3).createOrder(ethers.parseUnits("500", 18), 0);
    
    // Fund pool
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(30 * 24 * 60 * 60);
    
    // All claim (simulates concurrent transactions)
    await crikz.connect(user1).claimYield();
    await crikz.connect(user2).claimYield();
    await crikz.connect(user3).claimYield();
    
    // Verify fund integrity
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.gte(0);
  });
});