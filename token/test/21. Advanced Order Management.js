const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Advanced Order Management", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("10000"));
  });

  it("Should maintain correct indices and length after middle order removal", async function () {
    // 1. Create 3 distinct orders
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0); // Index 0
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 1); // Index 1
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 2); // Index 2

    // 2. Jump to unlock time (Standard Run is 34 days)
    await time.increase(35 * 24 * 60 * 60);

    // 3. Complete the middle order (Index 1)
    // The "Swap and Pop" logic should move Order 2 into the Index 1 slot
    await crikz.connect(user).completeOrder(1);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    
    // Check that the original Index 2 (300 tokens) is now at Index 1
    expect(orders[1].amount).to.equal(ethers.parseEther("300"));
    expect(orders[0].amount).to.equal(ethers.parseEther("100"));
  });

  it("Should revert when trying to complete a non-existent order index", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
    await expect(crikz.connect(user).completeOrder(5))
      .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex"); //
  });
});