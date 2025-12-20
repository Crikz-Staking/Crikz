const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: Deployment Edge Cases", function () {
  let owner, router;

  beforeEach(async function () {
    [owner, router] = await ethers.getSigners();
  });

  describe("Constructor Validations", function () {
    it("Should revert when router address is zero", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      
      await expect(
        Crikz.deploy(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Crikz, "InvalidAddress");
    });

    it("Should accept zero address for forwarder (disables meta-tx)", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.deploy(ethers.ZeroAddress, router.address);
      
      expect(await crikz.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should mint initial supply to deployer", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, router.address);
      
      const expectedSupply = ethers.parseUnits("1000000000", 18);
      expect(await crikz.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should initialize all order types correctly", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.deploy(ethers.ZeroAddress, router.address);
      
      for (let i = 0; i <= 6; i++) {
        const orderType = await crikz.orderTypes(i);
        expect(orderType.lockDuration).to.be.gt(0);
        expect(orderType.reputationMultiplier).to.be.gt(0);
      }
    });

    it("Should set correct router address", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.deploy(ethers.ZeroAddress, router.address);
      
      expect(await crikz.PANCAKESWAP_V2_ROUTER()).to.equal(router.address);
    });

    it("Should start unpaused", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.deploy(ethers.ZeroAddress, router.address);
      
      expect(await crikz.paused()).to.be.false;
    });

    it("Should initialize production fund with zero values", async function () {
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikz = await Crikz.deploy(ethers.ZeroAddress, router.address);
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.equal(0);
      expect(fund.totalReputation).to.equal(0);
      expect(fund.accumulatedYieldPerReputation).to.equal(0);
    });
  });
});