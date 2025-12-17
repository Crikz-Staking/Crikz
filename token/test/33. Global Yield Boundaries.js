const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Global Yield Boundaries", function () {
  let crikz, user, funder, forwarder, router;

  beforeEach(async function () {
    [_, user, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should drain the fund completely when theoretical yield exceeds balance", async function () {
    // Fund with only 5 tokens
    await crikz.fundProductionPool(ethers.parseEther("5"));
    await crikz.connect(user).createOrder(ethers.parseEther("500"), 4);

    // Wait 100 years
    await time.increase(100 * 365 * 24 * 60 * 60);

    const balanceBefore = await crikz.balanceOf(user.address);
    await crikz.connect(user).claimYield();
    const balanceAfter = await crikz.balanceOf(user.address);

    // The user should have received exactly 5 tokens (the fund balance)
    expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("5"), 1000000000n);
    
    const fund = await crikz.productionFund();
    expect(fund.balance).to.be.lt(1000000000n); // Effectively 0
  });
});