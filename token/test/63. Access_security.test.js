const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Access and Security", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(owner.address, owner.address);
  });

  it("Should prevent non-owners from pausing", async function () {
    await expect(crikz.connect(user).pause())
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should prevent creating orders when paused", async function () {
    await crikz.pause();
    const amount = ethers.parseUnits("10", 18);
    await expect(crikz.connect(owner).createOrder(amount, 0))
      .to.be.revertedWith("Pausable: paused");
  });

  it("Should properly initialize total supply to the deployer", async function () {
    const expectedSupply = ethers.parseUnits("1000000000", 18);
    expect(await crikz.totalSupply()).to.equal(expectedSupply);
    expect(await crikz.balanceOf(owner.address)).to.equal(expectedSupply);
  });
});