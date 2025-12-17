const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Protocol Gas Profiler", function () {
  let crikz, alice, funder, forwarder, router;

  beforeEach(async function () {
    [_, alice, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(alice.address, ethers.parseEther("1000"));
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should profile the optimized yield engine", async function () {
    // 1. Order Creation
    const tx1 = await crikz.connect(alice).createOrder(ethers.parseEther("100"), 2);
    const receipt1 = await tx1.wait();
    console.log(`\n      [GAS] createOrder: ${receipt1.gasUsed.toString()}`);

    // 2. Pool Funding
    const tx2 = await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
    const receipt2 = await tx2.wait();
    console.log(`      [GAS] fundPool:    ${receipt2.gasUsed.toString()}`);

    await time.increase(86400);

    // 3. Optimized Claim (O(1))
    const tx3 = await crikz.connect(alice).claimYield();
    const receipt3 = await tx3.wait();
    console.log(`      [GAS] claimYield:  ${receipt3.gasUsed.toString()}\n`);

    expect(receipt3.status).to.equal(1);
  });
});