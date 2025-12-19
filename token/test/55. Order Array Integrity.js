const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Order Manager Swap-and-Pop", function () {
  it("Should maintain array integrity when removing middle elements", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));

    await crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("20", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("30", 18), 0);

    // FIXED: Tier 0 lock duration is 5 DAYS (not 1 day)
    // 5 days = 5 * 86400 = 432000 seconds
    await time.increase(5 * 86400 + 1);

    // Remove middle order; triggers OrderManager.removeOrder logic
    await crikz.connect(user).completeOrder(1);

    const activeOrders = await crikz.getActiveOrders(user.address);
    expect(activeOrders.length).to.equal(2);
    expect(activeOrders[0].amount).to.equal(ethers.parseUnits("10", 18));
    // After swap-and-pop, the last element (30) moves to index 1
    expect(activeOrders[1].amount).to.equal(ethers.parseUnits("30", 18));
  });
});