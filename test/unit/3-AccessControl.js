const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: Access Control", function () {
  let crikz, owner, user, forwarder, router;

  beforeEach(async function () {
    [owner, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  describe("Owner Privileges", function () {
    it("Should only allow owner to pause", async function () {
      await expect(crikz.connect(user).pause()).to.be.reverted;
      await crikz.connect(owner).pause();
      expect(await crikz.paused()).to.be.true;
    });

    it("Should prevent non-owners from pausing", async function () {
      await expect(crikz.connect(user).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to update LP Pair address", async function () {
      const newPair = ethers.Wallet.createRandom().address;
      await crikz.setLPPairAddress(newPair);
      expect(await crikz.lpPair()).to.equal(newPair);
    });

    it("Should prevent non-owners from updating infrastructure", async function () {
      const dummyLP = ethers.Wallet.createRandom().address;
      await expect(
        crikz.connect(user).setLPPairAddress(dummyLP)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if owner tries to set LP Pair to address zero", async function () {
      await expect(
        crikz.setLPPairAddress(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(crikz, "InvalidAddress");
    });

    it("Should handle multiple LP Pair address updates", async function () {
      const addr1 = ethers.Wallet.createRandom().address;
      await crikz.setLPPairAddress(addr1);
      expect(await crikz.lpPair()).to.equal(addr1);
      
      const newPair = ethers.Wallet.createRandom().address;
      await crikz.setLPPairAddress(newPair);
      expect(await crikz.lpPair()).to.equal(newPair);
    });
  });
});