const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Production Fund", function () {
  let crikz, funder, forwarder, router;

  beforeEach(async function () {
    [_, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should increase fund balance", async function () {
    const amount = ethers.parseEther("1000");
    await crikz.connect(funder).fundProductionPool(amount);
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(amount);
  });
});