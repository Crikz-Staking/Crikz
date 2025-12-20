const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: Deployment", function () {
  let crikz, owner, forwarder, router;

  beforeEach(async function () {
    [owner, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
  });

  describe("Contract Initialization", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await crikz.name()).to.equal("Crikz Protocol Token");
      expect(await crikz.symbol()).to.equal("CRKZ");
    });

    it("Should mint initial supply to owner", async function () {
      const INITIAL_SUPPLY = ethers.parseEther("1000000000");
      const ownerBalance = await crikz.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct router address", async function () {
      expect(await crikz.PANCAKESWAP_V2_ROUTER()).to.equal(router.address);
    });

    it("Should revert if router address is zero", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      await expect(
        Crikz.deploy(forwarder.address, ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should properly initialize total supply to the deployer", async function () {
      const expectedSupply = ethers.parseUnits("1000000000", 18);
      expect(await crikz.totalSupply()).to.equal(expectedSupply);
      expect(await crikz.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });
});