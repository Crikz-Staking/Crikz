const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Extreme State & Integrity Tests", function () {
  let crikz, owner, user, whale, funder, forwarder, router;
  
  beforeEach(async function () {
    [owner, user, whale, funder, forwarder, router] = await ethers.getSigners();
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();

    const userAmount = ethers.parseUnits("10000", 18);
    const funderAmount = ethers.parseUnits("50000", 18);
    
    await crikz.connect(owner).transfer(user.address, userAmount);
    await crikz.connect(owner).transfer(funder.address, funderAmount);

    // Dynamic funding for the whale to avoid exceeding 1 billion tokens
    const ownerBalance = await crikz.balanceOf(owner.address);
    const whaleAmount = ownerBalance - ethers.parseUnits("100", 18); 
    await crikz.connect(owner).transfer(whale.address, whaleAmount);
  });

  it("Should allow a user to Claim Yield and immediately Re-stake (Compounding)", async function () {
    const startAmount = ethers.parseUnits("1000", 18);
    await crikz.connect(user).createOrder(startAmount, 0);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("5000", 18));
    await time.increase(30 * 24 * 60 * 60); 

    const balBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balAfter = await crikz.balanceOf(user.address);
    const yieldEarned = balAfter - balBefore;

    expect(yieldEarned).to.be.gt(0);

    // Re-staking earned yield
    await expect(
        crikz.connect(user).createOrder(yieldEarned, 0)
    ).to.not.be.reverted;
  });

  it("Should handle massive reputation calculations without overflowing", async function () {
    const whaleBal = await crikz.balanceOf(whale.address);
    await crikz.connect(whale).createOrder(whaleBal, 2); 
    
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(365 * 24 * 60 * 60); 

    await expect(crikz.connect(whale).claimYield()).to.not.be.reverted;
  });

  it("Should prevent completing an order in the same block if duration is not met", async function () {
    const amount = ethers.parseUnits("100", 18);
    await crikz.connect(user).createOrder(amount, 0); 
    await expect(
        crikz.connect(user).completeOrder(0)
    ).to.be.revertedWithCustomError(crikz, "OrderStillLocked");
  });

  it("Should block ALL state-changing functions when paused", async function () {
    const amount = ethers.parseUnits("100", 18);
    await crikz.connect(user).createOrder(amount, 0);
    await crikz.connect(owner).pause();

    await expect(crikz.connect(user).createOrder(amount, 0)).to.be.revertedWith("Pausable: paused");
    await expect(crikz.connect(funder).fundProductionPool(amount)).to.be.revertedWith("Pausable: paused");
    await expect(crikz.connect(user).claimYield()).to.be.revertedWith("Pausable: paused");
    
    await time.increase(100 * 24 * 60 * 60);
    await expect(crikz.connect(user).completeOrder(0)).to.be.revertedWith("Pausable: paused");

    await crikz.connect(owner).unpause();
    await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
  });

  it("Should exhaust the pool balance through continuous claims", async function () {
    // We fund 100 tokens
    const exactFund = ethers.parseUnits("100", 18);
    await crikz.connect(funder).fundProductionPool(exactFund);

    // User stakes a large amount to ensure high reputation
    await crikz.connect(user).createOrder(ethers.parseUnits("10000", 18), 2);
    
    // Fast forward 50 years to ensure yield debt > pool balance
    await time.increase(50 * 365 * 24 * 60 * 60);

    // First claim: This should trigger the "cap" in your claimYield logic
    await crikz.connect(user).claimYield();

    const fundAfterFirstClaim = await crikz.productionFund();
    
    // We expect the balance to be significantly reduced from the original 100 tokens
    // Since your APR math uses (balance * time), as the balance drops, yield slows down.
    // We check that the remaining balance is less than 1% of what we started with.
    const threshold = ethers.parseUnits("1", 18); // 1 token
    expect(fundAfterFirstClaim.balance).to.be.lt(threshold, "Pool was not sufficiently drained");
  });

  it("Should revert if accessing an Order Type that does not exist", async function () {
    await expect(
        crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 255)
    ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
  });
});