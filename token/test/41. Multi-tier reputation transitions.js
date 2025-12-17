const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Tier Transitions", function () {
  it("Should calculate correct reputation for each tier in isolation", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    
    await crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 2);
    
    const fund = await crikz.productionFund();
    const expectedRep = (ethers.parseUnits("200", 18) * 618n) / 1000n;
    expect(fund.totalReputation).to.equal(expectedRep);
  });
});