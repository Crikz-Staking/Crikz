const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Crikz - Yield Snapshot Integrity", function () {
  it("Should prevent new users from claiming historical yield", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const amount = ethers.parseUnits("100", 18);
    // Fund users and the contract pool
    await crikz.transfer(alice.address, amount);
    await crikz.transfer(bob.address, amount);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000", 18));

    await crikz.connect(alice).createOrder(amount, 0);
    
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    await crikz.connect(bob).createOrder(amount, 0);
    
    const totalProd = (await crikz.totalCreatorReputation(bob.address) * (await crikz.productionFund()).accumulatedYieldPerReputation) / BigInt(1e18);
    const debt = await crikz.creatorYieldDebt(bob.address);
    
    expect(totalProd - debt).to.equal(0);
  });
});