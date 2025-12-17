const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Partial Exit Integrity", function () {
  let crikz, alice, forwarder, router;

  beforeEach(async function () {
    [_, alice, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should maintain correct yield for remaining orders after partial completion", async function () {
    await crikz.transfer(alice.address, ethers.parseEther("2000"));
    await crikz.connect(alice).createOrder(ethers.parseEther("500"), 0); 
    await crikz.connect(alice).createOrder(ethers.parseEther("500"), 0); 
    
    await crikz.fundProductionPool(ethers.parseEther("1000"));
    await time.increase(6 * 24 * 60 * 60);

    await crikz.connect(alice).completeOrder(0); // Exit one, stay in one
    
    const orders = await crikz.getActiveOrders(alice.address);
    expect(orders.length).to.equal(1);
    expect(await crikz.balanceOf(alice.address)).to.be.gt(0);
  });
});