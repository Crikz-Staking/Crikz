const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Lifecycle", function () {
  let crikz, alice, funder, forwarder, router;

  beforeEach(async function () {
    [_, alice, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(alice.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should run full cycle: create -> fund -> wait -> claim -> complete", async function () {
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    await time.increase(6 * 24 * 60 * 60);
    await crikz.connect(alice).claimYield();
    await crikz.connect(alice).completeOrder(0);
    const orders = await crikz.getActiveOrders(alice.address);
    expect(orders.length).to.equal(0);
  });
});