const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Array Integrity", function () {
  let crikz, owner, user;
  const MIN_STAKE = ethers.parseUnits("10", 18);

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // CRITICAL FIX: Deploy with owner as the signer so owner gets INITIAL_SUPPLY
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address); 
    await crikz.waitForDeployment();

    // Now owner has the tokens and can transfer them
    const transferAmount = ethers.parseUnits("1000", 18);
    await crikz.connect(owner).transfer(user.address, transferAmount);
  });

  it("Should maintain state integrity after middle-array deletions (Swap-and-Pop)", async function () {
    // 1. Create 3 orders to test middle removal
    await crikz.connect(user).createOrder(MIN_STAKE, 0); 
    await crikz.connect(user).createOrder(MIN_STAKE * 2n, 1); 
    await crikz.connect(user).createOrder(MIN_STAKE * 3n, 2); 

    await time.increase(31 * 24 * 60 * 60); 

    // 2. Remove the middle order (index 1)
    await crikz.connect(user).completeOrder(1);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    // Verify Swap-and-Pop: original index 2 moved to index 1
    expect(orders[1].amount).to.equal(MIN_STAKE * 3n);
  });
});