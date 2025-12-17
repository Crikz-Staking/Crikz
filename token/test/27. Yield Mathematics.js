const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Mathematics Accuracy", function () {
  let crikz, user, funder, forwarder, router;

  beforeEach(async function () {
    [_, user, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should calculate yield based on 6.182% APR over 1 year", async function () {
    // 1. Create a Standard Run order (1.001x multiplier)
    await crikz.connect(user).createOrder(ethers.parseEther("1000"), 2);
    
    // 2. Fund the pool with 10,000 tokens
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("10000"));

    // 3. Fast forward exactly 365 days
    await time.increase(365 * 24 * 60 * 60);

    // 4. Theoretical Yield: 10,000 * 0.06182 = 618.2 tokens
    const balanceBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balanceAfter = await crikz.balanceOf(user.address);

    const receivedYield = balanceAfter - balanceBefore;
    // Allow for a 1 token margin due to block timestamp precision
    expect(receivedYield).to.be.closeTo(ethers.parseEther("618.2"), ethers.parseEther("1"));
  });
});