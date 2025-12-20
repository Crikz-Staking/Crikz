const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Performance: Scalability", function () {
  let crikz, owner, whale;

  beforeEach(async function () {
    [owner, whale] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    
    await crikz.connect(owner).transfer(whale.address, ethers.parseUnits("500000", 18));
  });

  it("Should profile the optimized yield engine", async function () {
    const tx1 = await crikz.connect(whale).createOrder(ethers.parseEther("100"), 2);
    const receipt1 = await tx1.wait();
    console.log(`\n      [GAS] createOrder: ${receipt1.gasUsed.toString()}`);
    expect(receipt1.gasUsed).to.be.lt(300000n);

    const tx2 = await crikz.connect(owner).fundProductionPool(ethers.parseEther("5000"));
    const receipt2 = await tx2.wait();
    console.log(`      [GAS] fundPool:    ${receipt2.gasUsed.toString()}`);
    expect(receipt2.gasUsed).to.be.lt(200000n);

    await time.increase(86400);

    const tx3 = await crikz.connect(whale).claimYield();
    const receipt3 = await tx3.wait();
    console.log(`      [GAS] claimYield:  ${receipt3.gasUsed.toString()}\n`);
    expect(receipt3.gasUsed).to.be.lt(200000n);

    // Wait for order to unlock (34 days for tier 2)
    await time.increase(35 * 24 * 60 * 60);
    
    const tx4 = await crikz.connect(whale).completeOrder(0);
    const receipt4 = await tx4.wait();
    console.log(`      [GAS] completeOrder: ${receipt4.gasUsed.toString()}`);
    expect(receipt4.gasUsed).to.be.lt(200000n);
  });

  it("Should handle massive reputation calculations without overflowing", async function () {
    const whaleBal = await crikz.balanceOf(whale.address);
    await crikz.connect(whale).createOrder(whaleBal, 2);
    
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(365 * 24 * 60 * 60);

    await expect(crikz.connect(whale).claimYield()).to.not.be.reverted;
  });
});