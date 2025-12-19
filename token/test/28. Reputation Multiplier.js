const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Reputation Multiplier Logic", function () {
  it("Should apply tier-specific multiplier correctly", async function () {
    const [owner, alice] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const stakeAmount = ethers.parseUnits("500", 18);
    // Fund Alice from the owner's initial supply
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("1000", 18));

    // Tier 3 has multiplier 1.273 (1273 * 10^15)
    await crikz.connect(alice).createOrder(stakeAmount, 3);
    const orders = await crikz.getActiveOrders(alice.address);
    
    // Expected: (500 * 1.273) = 636.5 tokens
    // Formula: (amount * multiplier) / 1e18
    const expectedReputation = (stakeAmount * 1273n * 10n**15n) / 10n**18n;
    expect(orders[0].reputation).to.equal(expectedReputation);
  });

  it("Should apply different multipliers for different tiers", async function () {
    const [owner, alice] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const stakeAmount = ethers.parseUnits("1000", 18);
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("10000", 18));

    // Tier 0: 0.618x multiplier
    await crikz.connect(alice).createOrder(stakeAmount, 0);
    let orders = await crikz.getActiveOrders(alice.address);
    let expectedRep = (stakeAmount * 618n * 10n**15n) / 10n**18n;
    expect(orders[0].reputation).to.equal(expectedRep);

    // Tier 2: 1.001x multiplier
    await crikz.connect(alice).createOrder(stakeAmount, 2);
    orders = await crikz.getActiveOrders(alice.address);
    expectedRep = (stakeAmount * 1001n * 10n**15n) / 10n**18n;
    expect(orders[1].reputation).to.equal(expectedRep);

    // Tier 6: 2.618x multiplier
    await crikz.connect(alice).createOrder(stakeAmount, 6);
    orders = await crikz.getActiveOrders(alice.address);
    expectedRep = (stakeAmount * 2618n * 10n**15n) / 10n**18n;
    expect(orders[2].reputation).to.equal(expectedRep);
  });
});