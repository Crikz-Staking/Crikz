const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Complete Lifecycle", function () {
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

  it("Should allow a user to Claim Yield and immediately Re-stake (Compounding)", async function () {
    const startAmount = ethers.parseUnits("1000", 18);
    await crikz.connect(alice).createOrder(startAmount, 0);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("5000", 18));
    await time.increase(30 * 24 * 60 * 60);

    const balBefore = await crikz.balanceOf(alice.address);
    await crikz.connect(alice).claimYield();
    const balAfter = await crikz.balanceOf(alice.address);
    const yieldEarned = balAfter - balBefore;

    expect(yieldEarned).to.be.gt(0);

    await expect(
      crikz.connect(alice).createOrder(yieldEarned, 0)
    ).to.not.be.reverted;
  });
});