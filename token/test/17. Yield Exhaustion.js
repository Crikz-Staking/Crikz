const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crikz - Yield Exhaustion & Safety Caps", function () {
  let crikz, owner, funder, user, forwarder, router;

  beforeEach(async function () {
    [owner, funder, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
    
    // Transfer tokens to funder and user for testing
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
    await crikz.transfer(user.address, ethers.parseEther("10000"));
  });

  it("Should cap yieldAccrued at the current fund balance (Drain Scenario)", async function () {
    // 1. Setup a small fund balance
    const initialFunding = ethers.parseEther("10");
    await crikz.connect(funder).fundProductionPool(initialFunding);

    // 2. User creates an order to generate reputation
    await crikz.connect(user).createOrder(ethers.parseEther("500"), 4); 

    // 3. Jump forward 100 years to ensure theoretical yield exceeds balance
    await time.increase(100 * 365 * 24 * 60 * 60);

    // 4. Trigger an update to drain the fund (via dummy claim)
    await crikz.connect(user).claimYield();

    // 5. Verify the fund balance is now effectively 0 (accounting for dust)
    let fund = await crikz.productionFund();
    expect(fund.balance).to.be.lt(1000n); 

    // 6. Fund with fresh capital
    const secondFunding = ethers.parseEther("1");
    await crikz.connect(owner).fundProductionPool(secondFunding);

    // 7. Verify the balance is now primarily the second funding amount
    fund = await crikz.productionFund();
    expect(fund.balance).to.be.closeTo(secondFunding, 1000n);
  });
});