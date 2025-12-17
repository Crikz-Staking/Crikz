const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Admin Transitions", function () {
  let crikz, owner, addr1, forwarder, router;

  beforeEach(async function () {
    [owner, addr1, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should handle multiple LP Pair address updates", async function () {
    await crikz.setLPPairAddress(addr1.address);
    expect(await crikz.lpPair()).to.equal(addr1.address);
    
    const newPair = ethers.Wallet.createRandom().address;
    await crikz.setLPPairAddress(newPair);
    expect(await crikz.lpPair()).to.equal(newPair);
  });

  it("Should revert if transfer is called with insufficient balance", async function () {
    const hugeAmount = ethers.parseEther("2000000000"); // More than supply
    await expect(
      crikz.connect(addr1).transfer(owner.address, hugeAmount)
    ).to.be.reverted; // Hits ERC20 branch coverage
  });
});