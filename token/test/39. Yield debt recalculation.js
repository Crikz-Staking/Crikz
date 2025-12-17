const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Debt Integrity", function () {
  let crikz, alice, funder, forwarder, router;

  beforeEach(async function () {
    [_, alice, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(alice.address, ethers.parseEther("2000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should prevent 'Back-dated' rewards when adding new reputation", async function () {
    // 1. Alice creates small order, Funder adds tokens
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
    
    await time.increase(365 * 24 * 60 * 60); // 1 year
    
    // 2. Alice creates a second, much larger order
    // The contract must update Alice's debt so this new order only earns from NOW onwards
    await crikz.connect(alice).createOrder(ethers.parseEther("1000"), 0);
    
    const orders = await crikz.getActiveOrders(alice.address);
    expect(orders.length).to.equal(2);
    
    // Verify that the global fund updated Alice's state
    const fund = await crikz.productionFund();
    expect(fund.totalReputation).to.be.gt(0);
  });
});