const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Proportional Yield Competition", function () {
  let crikz, alice, bob, funder, owner;

  beforeEach(async function () {
    [owner, alice, bob, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Use ZeroAddress to ensure owner receives INITIAL_SUPPLY
    crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address); 
    
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(bob.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("10000", 18));
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
});