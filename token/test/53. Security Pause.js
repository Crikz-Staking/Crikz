const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Emergency Security", function () {
  it("Should prevent orders and claims when paused", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.transfer(user.address, ethers.parseUnits("100", 18));

    // Pause the contract
    await crikz.pause();

    // Attempt to create an order - should revert
    await expect(
      crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0)
    ).to.be.revertedWith("Pausable: paused");

    // Attempt to claim yield - should revert
    await expect(
      crikz.connect(user).claimYield()
    ).to.be.revertedWith("Pausable: paused");

    // Unpause and verify it works again
    await crikz.unpause();
    await expect(
      crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0)
    ).to.not.be.reverted;
  });
});