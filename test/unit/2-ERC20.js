const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: ERC20 Functionality", function () {
  let crikz, owner, addr1, addr2, forwarder, router;

  beforeEach(async function () {
    [owner, addr1, addr2, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
  });

  describe("Token Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      await crikz.transfer(addr1.address, transferAmount);
      expect(await crikz.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      await expect(
        crikz.connect(addr1).transfer(owner.address, 1)
      ).to.be.reverted;
    });

    it("Should revert if transfer is called with insufficient balance", async function () {
      const hugeAmount = ethers.parseEther("2000000000");
      await expect(
        crikz.connect(addr1).transfer(owner.address, hugeAmount)
      ).to.be.reverted;
    });
  });
});