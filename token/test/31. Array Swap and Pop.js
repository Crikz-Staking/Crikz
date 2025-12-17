const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Manager Swap-and-Pop", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should swap the last order to the deleted index on completion", async function () {
    // 1. Create 3 distinct orders
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0); // Index 0
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 0); // Index 1
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 0); // Index 2

    // 2. Unlock all orders
    await time.increase(6 * 24 * 60 * 60);

    // 3. Complete Index 0. The order at Index 2 (300 tokens) should move to Index 0.
    await crikz.connect(user).completeOrder(0);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    expect(orders[0].amount).to.equal(ethers.parseEther("300"));
  });
});