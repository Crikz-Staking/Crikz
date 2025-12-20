const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security: Access Control", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Deploy with owner as deployer (not as forwarder)
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
  });

  it("Should prevent non-owners from pausing", async function () {
    await expect(crikz.connect(user).pause())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should prevent non-owners from updating infrastructure", async function () {
    const dummyLP = ethers.Wallet.createRandom().address;
    
    await expect(
      crikz.connect(user).setLPPairAddress(dummyLP)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert if owner tries to set LP Pair to address zero", async function () {
    // Owner must call this directly (not through a forwarder context)
    await expect(
      crikz.connect(owner).setLPPairAddress(ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(crikz, "InvalidAddress");
  });

  it("Should only allow owner to pause", async function () {
    await expect(crikz.connect(user).pause())
      .to.be.revertedWith("Ownable: caller is not the owner");
    
    await crikz.connect(owner).pause();
    expect(await crikz.paused()).to.be.true;
  });

  it("Should properly initialize total supply to the deployer", async function () {
    const expectedSupply = ethers.parseUnits("1000000000", 18);
    expect(await crikz.totalSupply()).to.equal(expectedSupply);
    expect(await crikz.balanceOf(owner.address)).to.equal(expectedSupply);
  });

  it("Should allow owner to unpause after pausing", async function () {
    await crikz.connect(owner).pause();
    expect(await crikz.paused()).to.be.true;
    
    await crikz.connect(owner).unpause();
    expect(await crikz.paused()).to.be.false;
  });

  it("Should prevent non-owners from unpausing", async function () {
    await crikz.connect(owner).pause();
    
    await expect(crikz.connect(user).unpause())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should allow owner to update LP Pair address", async function () {
    const newLP = ethers.Wallet.createRandom().address;
    
    // Owner calls directly
    await expect(crikz.connect(owner).setLPPairAddress(newLP))
      .to.emit(crikz, "LPPairSet");
    
    expect(await crikz.lpPair()).to.equal(newLP);
  });
});