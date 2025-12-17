const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Admin Security", function () {
  let crikz, owner, user, forwarder, router;

  beforeEach(async function () {
    [owner, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should prevent non-owners from updating infrastructure", async function () {
    const dummyLP = ethers.Wallet.createRandom().address;
    
    // Check that non-owner is reverted by Ownable
    await expect(
      crikz.connect(user).setLPPairAddress(dummyLP)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert if owner tries to set LP Pair to address zero", async function () {
    // Check for your custom error "InvalidAddress"
    await expect(
      crikz.setLPPairAddress(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(crikz, "InvalidAddress");
  });

  it("Should block createOrder when paused", async function () {
    await crikz.pause();
    await expect(
      crikz.connect(user).createOrder(ethers.parseEther("100"), 0)
    ).to.be.reverted; // Should be reverted by Pausable
  });
});