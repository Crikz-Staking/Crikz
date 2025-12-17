const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Anti-Dilution Integrity", function () {
  let crikz, alice, bob, forwarder, router;

  beforeEach(async function () {
    [_, alice, bob, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(alice.address, ethers.parseEther("1000"));
    await crikz.transfer(bob.address, ethers.parseEther("1000"));
  });

  it("Should prevent new users from capturing yield from before their entry", async function () {
    // 1. Alice creates an order
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    
    // 2. Fund the pool (this updates the global index)
    await crikz.fundProductionPool(ethers.parseEther("5000"));

    // 3. Bob joins immediately after funding
    await crikz.connect(bob).createOrder(ethers.parseEther("100"), 0);

    // Verify Bob's yield debt is set such that his current pending yield is 0
    // If your contract has a getPendingYield function:
    // expect(await crikz.getPendingYield(bob.address)).to.equal(0);
    
    // Otherwise, check that Bob cannot claim anything immediately
    await expect(
        crikz.connect(bob).claimYield()
    ).to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });
});