const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Multi-User Yield Attribution", function () {
  let crikz, owner, userA, userB, funder;

  beforeEach(async function () {
    [owner, userA, userB, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // CRITICAL FIX: Deploy with owner as deployer
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    // Distribute tokens to participants from owner's balance
    await crikz.connect(owner).transfer(userA.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(userB.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("10000", 18));
  });

  it("Should fairly distribute rewards based on reputation timing", async function () {
    await crikz.connect(userA).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("500", 18));
    
    await time.increase(15 * 24 * 60 * 60); 

    await crikz.connect(userB).createOrder(ethers.parseUnits("100", 18), 0);
    await time.increase(15 * 24 * 60 * 60); 

    await crikz.connect(userA).claimYield();
    await crikz.connect(userB).claimYield();

    const balA = await crikz.balanceOf(userA.address);
    const balB = await crikz.balanceOf(userB.address);
    
    // User A should have more because they were in the pool longer 
    expect(balA).to.be.gt(balB);
  });
});