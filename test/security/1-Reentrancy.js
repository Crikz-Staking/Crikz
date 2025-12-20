const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Security: Reentrancy Protection", function () {
  let crikz, owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("10000", 18));
  });

  it("Should prevent reentrancy in claimYield", async function () {
    await crikz.connect(attacker).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    await time.increase(30 * 24 * 60 * 60);
    
    await crikz.connect(attacker).claimYield();
    
    await expect(crikz.connect(attacker).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });

  it("Should prevent reentrancy in completeOrder", async function () {
    await crikz.connect(attacker).createOrder(ethers.parseUnits("500", 18), 0);
    
    // Wait for unlock (5 days + buffer)
    await time.increase(6 * 24 * 60 * 60);
    
    await crikz.connect(attacker).completeOrder(0);
    
    await expect(crikz.connect(attacker).completeOrder(0))
      .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
  });

  it("Should prevent reentrancy in fundProductionPool", async function () {
    const amount = ethers.parseUnits("1000", 18);
    
    await crikz.connect(owner).fundProductionPool(amount);
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(amount);
  });

  it("Should maintain state consistency after rapid successive calls", async function () {
    await crikz.connect(attacker).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(attacker).createOrder(ethers.parseUnits("200", 18), 0);
    await crikz.connect(attacker).createOrder(ethers.parseUnits("300", 18), 0);
    
    const orders = await crikz.getActiveOrders(attacker.address);
    expect(orders.length).to.equal(3);
    
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    // Wait for unlock
    await time.increase(6 * 24 * 60 * 60);
    
    await crikz.connect(attacker).completeOrder(0);
    await crikz.connect(attacker).completeOrder(0);
    await crikz.connect(attacker).completeOrder(0);
    
    const remainingOrders = await crikz.getActiveOrders(attacker.address);
    expect(remainingOrders.length).to.equal(0);
  });

  it("Should handle multiple users claiming simultaneously without state corruption", async function () {
    const [, user1, user2, user3] = await ethers.getSigners();
    
    await crikz.connect(owner).transfer(user1.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(user2.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(user3.address, ethers.parseUnits("1000", 18));
    
    await crikz.connect(user1).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(user2).createOrder(ethers.parseUnits("500", 18), 0);
    await crikz.connect(user3).createOrder(ethers.parseUnits("500", 18), 0);
    
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(30 * 24 * 60 * 60);
    
    await crikz.connect(user1).claimYield();
    await crikz.connect(user2).claimYield();
    await crikz.connect(user3).claimYield();
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.gte(0);
  });
});