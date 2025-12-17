const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Array Boundary Checks", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    // CRITICAL: Give user tokens so they can create the initial order
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should revert when accessing index equal to length", async function () {
    const amount = ethers.parseEther("100");
    await crikz.connect(user).createOrder(amount, 0); // Creates Index 0
    
    // Attempting to complete Index 1 (which doesn't exist)
    await expect(crikz.connect(user).completeOrder(1))
      .to.be.revertedWithCustomError(crikz, "InvalidOrderIndex");
  });
});