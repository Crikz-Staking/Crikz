const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: OrderTypes", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("100000", 18));
  });

  it("Should enforce correct lock durations for all 7 order types", async function () {
    const orderTypeData = [
      { type: 0, duration: 5 * 24 * 60 * 60, name: "Prototype", multiplier: 618n },
      { type: 1, duration: 13 * 24 * 60 * 60, name: "Small Batch", multiplier: 787n },
      { type: 2, duration: 34 * 24 * 60 * 60, name: "Standard Run", multiplier: 1001n },
      { type: 3, duration: 89 * 24 * 60 * 60, name: "Mass Production", multiplier: 1273n },
      { type: 4, duration: 233 * 24 * 60 * 60, name: "Industrial", multiplier: 1619n },
      { type: 5, duration: 610 * 24 * 60 * 60, name: "Global Scale", multiplier: 2059n },
      { type: 6, duration: 1597 * 24 * 60 * 60, name: "Monopoly", multiplier: 2618n }
    ];

    for (let i = 0; i < orderTypeData.length; i++) {
      const orderData = orderTypeData[i];
      const amount = ethers.parseUnits("1000", 18);
      
      await crikz.connect(user).createOrder(amount, orderData.type);
      
      const orders = await crikz.getActiveOrders(user.address);
      const currentOrder = orders[i];
      
      expect(currentOrder.duration).to.equal(orderData.duration, 
        `${orderData.name} should have duration ${orderData.duration}`);
      
      // Verify correct reputation multiplier
      const expectedRep = (amount * orderData.multiplier) / 1000n;
      expect(currentOrder.reputation).to.equal(expectedRep,
        `${orderData.name} should have correct reputation`);
    }
    
    await expect(crikz.connect(user).completeOrder(0))
      .to.be.revertedWithCustomError(crikz, "OrderStillLocked");
    
    await time.increase(orderTypeData[0].duration + 1);
    
    await expect(crikz.connect(user).completeOrder(0))
      .to.emit(crikz, "OrderCompleted");
  });

  it("Should initialize all 7 order types with correct durations", async function () {
    const tier0 = await crikz.orderTypes(0);
    expect(tier0.lockDuration).to.equal(5 * 24 * 60 * 60);

    const tier1 = await crikz.orderTypes(1);
    expect(tier1.lockDuration).to.equal(13 * 24 * 60 * 60);

    const tier2 = await crikz.orderTypes(2);
    expect(tier2.lockDuration).to.equal(34 * 24 * 60 * 60);

    const tier3 = await crikz.orderTypes(3);
    expect(tier3.lockDuration).to.equal(89 * 24 * 60 * 60);

    const tier4 = await crikz.orderTypes(4);
    expect(tier4.lockDuration).to.equal(233 * 24 * 60 * 60);

    const tier5 = await crikz.orderTypes(5);
    expect(tier5.lockDuration).to.equal(610 * 24 * 60 * 60);

    const tier6 = await crikz.orderTypes(6);
    expect(tier6.lockDuration).to.equal(1597 * 24 * 60 * 60);

    await expect(crikz.orderTypes(7)).to.be.reverted;
  });

  it("Should calculate correct reputation for all 7 order types", async function () {
    const [testOwner, tester] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    const stakeAmount = ethers.parseUnits("1000", 18);
    await crikz.connect(testOwner).transfer(tester.address, ethers.parseUnits("10000", 18));

    const expectedReps = [
      (stakeAmount * 618n) / 1000n,   // Tier 0
      (stakeAmount * 787n) / 1000n,   // Tier 1
      (stakeAmount * 1001n) / 1000n,  // Tier 2
      (stakeAmount * 1273n) / 1000n,  // Tier 3
      (stakeAmount * 1619n) / 1000n,  // Tier 4
      (stakeAmount * 2059n) / 1000n,  // Tier 5
      (stakeAmount * 2618n) / 1000n   // Tier 6
    ];

    for (let i = 0; i < 7; i++) {
      await crikz.connect(tester).createOrder(stakeAmount, i);
      const orders = await crikz.getActiveOrders(tester.address);
      expect(orders[i].reputation).to.equal(expectedReps[i]);
    }
  });

  it("Should calculate correct reputation for each tier in isolation", async function () {
    const [testOwner, testUser] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    await crikz.connect(testOwner).transfer(testUser.address, ethers.parseUnits("10000", 18));
    
    await crikz.connect(testUser).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(testUser).createOrder(ethers.parseUnits("100", 18), 2);
    
    const fund = await crikz.productionFund();
    const expectedRep0 = (ethers.parseUnits("100", 18) * 618n) / 1000n;
    const expectedRep2 = (ethers.parseUnits("100", 18) * 1001n) / 1000n;
    const expectedTotal = expectedRep0 + expectedRep2;
    
    expect(fund.totalReputation).to.equal(expectedTotal);
  });

  it("Should apply fixed multiplier regardless of user balance", async function () {
    const [testOwner, alice] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    const stakeAmount = ethers.parseUnits("500", 18);
    await crikz.connect(testOwner).transfer(alice.address, ethers.parseUnits("1000", 18));

    await crikz.connect(alice).createOrder(stakeAmount, 3);
    const orders = await crikz.getActiveOrders(alice.address);
    
    // Tier 3 has 1.273x multiplier
    const expectedReputation = (stakeAmount * 1273n) / 1000n;
    expect(orders[0].reputation).to.equal(expectedReputation);
  });

  it("Should accept all 7 tiers and track cumulative reputation", async function () {
    const [testOwner, bob] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    const amountPerOrder = ethers.parseUnits("100", 18);
    const totalToTransfer = ethers.parseUnits("1000", 18);

    const ownerBal = await crikz.balanceOf(testOwner.address);
    if (ownerBal < totalToTransfer) {
      throw new Error(`Owner only has ${ownerBal}. Minting failed in constructor!`);
    }

    await crikz.connect(testOwner).transfer(bob.address, totalToTransfer);

    for (let i = 0; i <= 6; i++) {
      await crikz.connect(bob).createOrder(amountPerOrder, i);
    }
    
    const orders = await crikz.getActiveOrders(bob.address);
    expect(orders.length).to.equal(7);
  });
});