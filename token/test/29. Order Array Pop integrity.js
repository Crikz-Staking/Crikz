const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Manager Integrity", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("5000"));
  });

  it("Should maintain correct indices after removing a middle order", async function () {
    // Create 3 orders
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0); // Index 0
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 0); // Index 1
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 0); // Index 2

    await time.increase(6 * 24 * 60 * 60); // Unlock all

    // Complete index 1. Index 2 (300 tokens) should move to Index 1.
    await crikz.connect(user).completeOrder(1);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    expect(orders[0].amount).to.equal(ethers.parseEther("100"));
    expect(orders[1].amount).to.equal(ethers.parseEther("300"));
  });
});