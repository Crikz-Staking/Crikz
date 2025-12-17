const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Storage Integrity (Swap and Pop)", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("5000"));
  });

  it("Should maintain order integrity across multiple removals", async function () {
    // 1. Create 5 orders with identifiable amounts
    const amounts = [100, 200, 300, 400, 500];
    for(let a of amounts) {
        await crikz.connect(user).createOrder(ethers.parseEther(a.toString()), 0);
    }

    await time.increase(6 * 24 * 60 * 60);

    // 2. Remove the middle order (Index 2 - 300 tokens)
    // The last order (500 tokens) should move to Index 2
    await crikz.connect(user).completeOrder(2);

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(4);
    expect(orders[2].amount).to.equal(ethers.parseEther("500"));
    
    // 3. Remove the new Index 0 (100 tokens)
    // The current last order (400 tokens) should move to Index 0
    await crikz.connect(user).completeOrder(0);
    
    const remaining = await crikz.getActiveOrders(user.address);
    expect(remaining.length).to.equal(3);
    expect(remaining[0].amount).to.equal(ethers.parseEther("400"));
  });
});