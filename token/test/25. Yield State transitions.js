const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield State Transitions", function () {
  let crikz, funder, forwarder, router;

  beforeEach(async function () {
    [_, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should update fund balance and timestamp on multiple fundings", async function () {
    const amount = ethers.parseEther("1000");
    
    // First funding
    await crikz.connect(funder).fundProductionPool(amount);
    let fund = await crikz.productionFund();
    const firstTimestamp = fund.lastUpdateTime;

    // Force time to advance so the next block has a new timestamp
    await time.increase(1);

    // Second funding
    await crikz.connect(funder).fundProductionPool(amount);
    fund = await crikz.productionFund();
    
    expect(fund.balance).to.equal(amount * 2n);
    // This will now pass because we advanced time
    expect(fund.lastUpdateTime).to.be.gt(firstTimestamp);
  });
});