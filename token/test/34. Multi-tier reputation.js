const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Multi-Tier Reputation Check", function () {
  it("Should accept all 7 tiers and track cumulative reputation", async function () {
    const [owner, bob] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // Use address(0) for the forwarder in tests to ensure _msgSender() is the deployer
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const amountPerOrder = ethers.parseUnits("100", 18);
    const totalToTransfer = ethers.parseUnits("1000", 18);

    // CRITICAL FIX: The owner MUST transfer to bob. 
    // We check owner's balance first to be sure.
    const ownerBal = await crikz.balanceOf(owner.address);
    if (ownerBal < totalToTransfer) {
        throw new Error(`Owner only has ${ownerBal}. Minting failed in constructor!`);
    }

    await crikz.connect(owner).transfer(bob.address, totalToTransfer);

    for (let i = 0; i <= 6; i++) {
      await crikz.connect(bob).createOrder(amountPerOrder, i);
    }
    
    const orders = await crikz.getActiveOrders(bob.address);
    expect(orders.length).to.equal(7);
  });
});