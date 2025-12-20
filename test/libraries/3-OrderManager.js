const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: OrderManager", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  it("Should maintain array integrity via swap-and-pop", async function () {
    await crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("20", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("30", 18), 0);

    // Wait for orders to unlock (5 days + buffer)
    await time.increase(6 * 24 * 60 * 60);

    await crikz.connect(user).completeOrder(1);

    const activeOrders = await crikz.getActiveOrders(user.address);
    expect(activeOrders.length).to.equal(2);
    expect(activeOrders[0].amount).to.equal(ethers.parseUnits("10", 18));
    expect(activeOrders[1].amount).to.equal(ethers.parseUnits("30", 18));
  });

  it("Should correctly swap last order to index of completed order", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);

    await time.increase(6 * 24 * 60 * 60);

    await crikz.connect(user).completeOrder(0);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    expect(orders[0].amount).to.equal(ethers.parseEther("300"));
    expect(orders[1].amount).to.equal(ethers.parseEther("200"));
  });

  it("Should swap the last order to the deleted index on completion", async function () {
    await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
    await crikz.connect(user).createOrder(ethers.parseEther("300"), 0);

    await time.increase(6 * 24 * 60 * 60);

    await crikz.connect(user).completeOrder(0);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(2);
    expect(orders[0].amount).to.equal(ethers.parseEther("300"));
  });
});