const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Fund Safety Caps", function () {
  it("Should cap claims to the available productionFund balance", async function () {
    const [owner, alice, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("10", 18));

    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 4);
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("10", 18));
    
    await time.increase(100 * 365 * 24 * 60 * 60);
    
    const aliceBalBefore = await crikz.balanceOf(alice.address);
    await crikz.connect(alice).claimYield();
    const aliceEarned = (await crikz.balanceOf(alice.address)) - aliceBalBefore;
    
    // Safety check in claimYield prevents transferring more than pool balance
    expect(aliceEarned).to.be.lte(ethers.parseUnits("10", 18));
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.lt(ethers.parseUnits("0.0001", 18));
  });
});