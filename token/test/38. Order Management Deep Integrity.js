const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Manager Boundary Cases", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should handle removal of the final order in the array correctly", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);

    await time.increase(6 * 24 * 60 * 60);

    // Complete index 1 (the last index). 
    // Logic should skip the swap and just pop.
    await crikz.connect(user).completeOrder(1);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(1);
    expect(orders[0].amount).to.equal(ethers.parseEther("100"));
  });
});