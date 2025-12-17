// test/01_Crikz_Deployment_ERC20.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Deployment and ERC20 Functionality", function () {
  let crikz;
  let owner;
  let addr1;
  let addr2;
  let forwarder;
  let router;
  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 Billion tokens

  beforeEach(async function () {
    [owner, addr1, addr2, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await crikz.name()).to.equal("Crikz Protocol Token");
      expect(await crikz.symbol()).to.equal("CRKZ");
    });

    it("Should mint initial supply to owner", async function () {
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
  });

  describe("ERC20 Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      await crikz.transfer(addr1.address, transferAmount);
      expect(await crikz.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await crikz.balanceOf(owner.address);
      await expect(
        crikz.connect(addr1).transfer(owner.address, 1)
      ).to.be.reverted;
    });
  });
});