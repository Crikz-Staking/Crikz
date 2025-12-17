const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Cap Verification", function () {
  let crikz, user, funder, forwarder, router;

  beforeEach(async function () {
    [_, user, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should never distribute more than the available fund balance", async function () {
    // Fund with only 10 tokens
    await crikz.fundProductionPool(ethers.parseEther("10"));
    await crikz.connect(user).createOrder(ethers.parseEther("500"), 4);

    // Wait 50 years to generate massive theoretical yield
    await time.increase(50 * 365 * 24 * 60 * 60);

    const initialBal = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const finalBal = await crikz.balanceOf(user.address);

    // Claimed amount must be roughly 10 tokens, even if math suggests more
    expect(finalBal - initialBal).to.be.closeTo(ethers.parseEther("10"), ethers.parseEther("0.01"));
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.lt(1000000000n); // Effectively empty (dust only)
  });
});