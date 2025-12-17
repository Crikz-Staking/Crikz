const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Crikz - Priority Isolation", function () {
  it("Should prove Alice earns more due to head start", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const stake = ethers.parseUnits("100", 18);
    const poolSeed = ethers.parseUnits("10000", 18);

    // 1. Give users tokens
    await crikz.transfer(alice.address, stake);
    await crikz.transfer(bob.address, stake);

    // 2. SEED THE POOL (The contract needs tokens to pay rewards!)
    // fundProductionPool moves tokens from owner -> contract
    await crikz.connect(owner).fundProductionPool(poolSeed);

    // 3. Perform Logic
    await crikz.connect(alice).createOrder(stake, 0);
    await network.provider.send("evm_increaseTime", [86400]);
    await network.provider.send("evm_mine");

    await crikz.connect(bob).createOrder(stake, 0);
    await network.provider.send("evm_increaseTime", [86400]);
    await network.provider.send("evm_mine");

    await crikz.connect(alice).claimYield();
    await crikz.connect(bob).claimYield();

    expect(await crikz.balanceOf(alice.address)).to.be.gt(await crikz.balanceOf(bob.address));
  });
});