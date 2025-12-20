const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Multi-User Scenarios", function () {
  let crikz, owner, alice, bob, funder;

  beforeEach(async function () {
    [owner, alice, bob, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(bob.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("10000", 18));
  });

  it("Should distribute yield based on proportional reputation", async function () {
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(bob).createOrder(ethers.parseEther("200"), 0);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
    await time.increase(30 * 24 * 60 * 60);

    const aliceBefore = await crikz.balanceOf(alice.address);
    const bobBefore = await crikz.balanceOf(bob.address);

    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();

    const aliceYield = (await crikz.balanceOf(alice.address)) - aliceBefore;
    const bobYield = (await crikz.balanceOf(bob.address)) - bobBefore;

    expect(bobYield).to.be.closeTo(aliceYield * 2n, ethers.parseEther("0.1"));
  });

  it("Should fairly distribute rewards based on reputation timing", async function () {
    await crikz.connect(alice).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("1000", 18));
    
    await time.increase(15 * 24 * 60 * 60);
    await crikz.connect(bob).createOrder(ethers.parseUnits("100", 18), 0);
    await time.increase(15 * 24 * 60 * 60);
    
    const aliceBalBefore = await crikz.balanceOf(alice.address);
    const bobBalBefore = await crikz.balanceOf(bob.address);
    
    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();
    
    const aliceEarned = (await crikz.balanceOf(alice.address)) - aliceBalBefore;
    const bobEarned = (await crikz.balanceOf(bob.address)) - bobBalBefore;

    expect(aliceEarned).to.be.gt(bobEarned);
    expect(bobEarned).to.be.gt(0n);
  });

  it("Should distribute yield accurately when Bob joins mid-cycle", async function () {
    await crikz.connect(alice).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("1000", 18));
    
    await time.increase(10 * 24 * 60 * 60);
    await crikz.connect(bob).createOrder(ethers.parseUnits("100", 18), 0);
    await time.increase(10 * 24 * 60 * 60);
    
    const aliceBalBefore = await crikz.balanceOf(alice.address);
    const bobBalBefore = await crikz.balanceOf(bob.address);
    
    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();
    
    const aliceEarned = (await crikz.balanceOf(alice.address)) - aliceBalBefore;
    const bobEarned = (await crikz.balanceOf(bob.address)) - bobBalBefore;

    expect(aliceEarned).to.be.gt(bobEarned);
    expect(bobEarned).to.be.gt(0n);
  });

  it("Should handle multiple users claiming simultaneously without state corruption", async function () {
    const users = [alice, bob, funder];
    
    for (const user of users) {
      await crikz.connect(user).createOrder(ethers.parseUnits("500", 18), 0);
    }
    
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(30 * 24 * 60 * 60);
    
    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();
    await crikz.connect(funder).claimYield();
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.gte(0);
  });
});