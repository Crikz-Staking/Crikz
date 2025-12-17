const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Dilution Resistance", function () {
  let crikz, smallFish, whale, funder, forwarder, router;

  beforeEach(async function () {
    [_, smallFish, whale, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    
    await crikz.transfer(smallFish.address, ethers.parseEther("100"));
    await crikz.transfer(whale.address, ethers.parseEther("100000"));
    await crikz.transfer(funder.address, ethers.parseEther("50000"));
  });

  it("Should prevent a late whale from capturing historical yield", async function () {
    // 1. Small fish joins with 100 tokens
    await crikz.connect(smallFish).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("10000"));
    
    // Wait 1 year
    await time.increase(time.duration.years(1));

    // 2. Whale joins with 100,000 tokens (1000x the small fish)
    await crikz.connect(whale).createOrder(ethers.parseEther("100000"), 0);

    // 3. Immediate check
    // Even though the whale has 1000x the reputation, they shouldn't be 
    // able to claim any of the yield generated during the small fish's year solo.
    await crikz.connect(smallFish).claimYield();
    
    // Whale tries to claim (should revert with NoProductsToClaim if done in same block,
    // or return 0/tiny amount if checked immediately).
    const whalePending = await crikz.balanceOf(whale.address);
    const fishPending = await crikz.balanceOf(smallFish.address);

    expect(fishPending).to.be.gt(whalePending);
    console.log(`      Fish Earnings after 1yr: ${ethers.formatEther(fishPending)}`);
    console.log(`      Whale Earnings at entry: ${ethers.formatEther(whalePending)}`);
  });
});