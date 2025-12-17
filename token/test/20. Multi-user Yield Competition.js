const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Proportional Yield Competition", function () {
  let crikz, alice, bob, funder, forwarder, router;

  beforeEach(async function () {
    [_, alice, bob, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(alice.address, ethers.parseEther("1000"));
    await crikz.transfer(bob.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should distribute yield based on proportional reputation", async function () {
    // Alice: 100 tokens, Bob: 200 tokens
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(bob).createOrder(ethers.parseEther("200"), 0);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
    await time.increase(30 * 24 * 60 * 60);

    const aliceBefore = await crikz.balanceOf(alice.address);
    const bobBefore = await crikz.balanceOf(bob.address);

    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();

    const aliceYield = (await crikz.balanceOf(alice.address)) - aliceBefore;
    const bobYield = (await crikz.balanceOf(bob.address)) - bobBefore;

    // Bob has 2x reputation, so his yield should be approx 2x Alice's
    expect(bobYield).to.be.closeTo(aliceYield * 2n, ethers.parseEther("0.1"));
  });
});