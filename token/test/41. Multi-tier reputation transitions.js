const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Tier Transitions", function () {
  it("Should calculate correct reputation for each tier in isolation", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    
    const amount = ethers.parseUnits("100", 18);
    
    // Tier 0: 0.618x multiplier -> 100 * 0.618 = 61.8 tokens
    await crikz.connect(user).createOrder(amount, 0);
    
    // Tier 2: 1.001x multiplier -> 100 * 1.001 = 100.1 tokens
    await crikz.connect(user).createOrder(amount, 2);
    
    const fund = await crikz.productionFund();
    
    // Total reputation = 61.8 + 100.1 = 161.9 tokens
    const tier0Rep = (amount * 618n * 10n**15n) / 10n**18n;
    const tier2Rep = (amount * 1001n * 10n**15n) / 10n**18n;
    const expectedTotalRep = tier0Rep + tier2Rep;
    
    expect(fund.totalReputation).to.equal(expectedTotalRep);
  });

  it("Should track individual order reputations correctly", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    
    const amount = ethers.parseUnits("100", 18);
    
    await crikz.connect(user).createOrder(amount, 0);
    await crikz.connect(user).createOrder(amount, 2);
    
    const orders = await crikz.getActiveOrders(user.address);
    
    // Verify each order has correct reputation
    expect(orders[0].reputation).to.equal((amount * 618n * 10n**15n) / 10n**18n);
    expect(orders[1].reputation).to.equal((amount * 1001n * 10n**15n) / 10n**18n);
  });
});