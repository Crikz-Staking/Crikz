const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Removal Integrity", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("5000"));
  });

  it("Should correctly maintain order array via swap-and-pop", async function () {
    // 1. Create 3 distinct orders
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0); // Index 0
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 1); // Index 1
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 2); // Index 2

    // 2. Wait for locks
    await time.increase(15 * 24 * 60 * 60);

    // 3. Complete the middle order (Index 1)
    // Internal logic: Index 2 moves to Index 1, and array pops
    await crikz.connect(user).completeOrder(1);

    const activeOrders = await crikz.getActiveOrders(user.address);
    expect(activeOrders.length).to.equal(2);
    
    // Verify Index 1 is now the order that was originally Index 2
    expect(activeOrders[1].amount).to.equal(ethers.parseEther("300"));
    expect(activeOrders[0].amount).to.equal(ethers.parseEther("100"));
  });
});