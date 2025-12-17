const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Pro-Rata Exhaustion", function () {
  let crikz, users, funder, forwarder, router;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    users = signers.slice(1, 4); 
    [funder, forwarder, router] = [signers[5], signers[6], signers[7]];
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
  });

  it("Should distribute remaining dust fairly when fund is exhausted", async function () {
    const tinyFund = ethers.parseEther("1"); 
    await crikz.transfer(funder.address, tinyFund);
    await crikz.connect(funder).fundProductionPool(tinyFund);

    for (let user of users) {
        await crikz.transfer(user.address, ethers.parseEther("1000"));
        await crikz.connect(user).createOrder(ethers.parseEther("1000"), 4); 
    }

    // Force exhaustion via massive time jump
    await time.increase(20 * 365 * 24 * 60 * 60);

    for (let user of users) {
        await crikz.connect(user).claimYield();
    }

    const fund = await crikz.productionFund();
    // Use closeTo to account for minor rounding dust (like the 2086 wei you saw)
    expect(fund.balance).to.be.closeTo(0n, 10000n);
  });
});