const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Economic Stability & Integrity", function () {
  let crikz, owner, user1, funder, forwarder, router;

  beforeEach(async function () {
    [owner, user1, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user1.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should not allow yield claims to exceed the available fund balance", async function () {
    // 1. Create a large order to generate high reputation
    await crikz.connect(user1).createOrder(ethers.parseEther("1000"), 4); // Industrial
    // 2. Fund the pool with a very small amount
    const tinyFund = ethers.parseEther("1");
    await crikz.connect(funder).fundProductionPool(tinyFund);
    
    // 3. Advance time by 50 years to ensure accrued yield > balance
    await time.increase(50 * 365 * 24 * 60 * 60);

    // 4. Claim yield. It should be capped at the balance of the fund.
    const balBefore = await crikz.balanceOf(user1.address);
    await crikz.connect(user1).claimYield();
    const balAfter = await crikz.balanceOf(user1.address);
    
    expect(balAfter - balBefore).to.be.lte(tinyFund);
  });

  it("Should handle 'dust' amounts without failing", async function () {
    // MIN_ORDER_AMOUNT is 1 WAD (1 token)[cite: 2].
    const dust = ethers.parseEther("1.000000000000000001"); 
    await expect(crikz.connect(user1).createOrder(dust, 0)).to.not.be.reverted;
    
    const orders = await crikz.getActiveOrders(user1.address);
    expect(orders[0].amount).to.equal(dust);
  });

  it("Should prevent state corruption when an order is completed immediately after unlock", async function () {
    await crikz.connect(user1).createOrder(ethers.parseEther("100"), 0);
    const duration = 5 * 24 * 60 * 60; // Prototype duration [cite: 4]
    
    await time.increase(duration);
    
    // Complete immediately. This ensures there are no precision issues with 
    // block.timestamp being exactly equal to lockUntil.
    await expect(crikz.connect(user1).completeOrder(0))
      .to.emit(crikz, "OrderCompleted");
  });
});