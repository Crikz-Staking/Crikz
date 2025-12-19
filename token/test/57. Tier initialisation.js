const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Tier Configuration", function () {
  it("Should initialize all 7 order types with correct durations", async function () {
    const [owner] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(owner.address, owner.address);

    // FIXED: Convert number to BigInt before multiplication
    // Tier 0: 5 days (Fibonacci)
    const tier0 = await crikz.orderTypes(0);
    expect(tier0.lockDuration).to.equal(BigInt(5 * 86400));

    // Tier 1: 13 days (Fibonacci)
    const tier1 = await crikz.orderTypes(1);
    expect(tier1.lockDuration).to.equal(BigInt(13 * 86400));

    // Verify the MAX_ORDER_TYPE boundary
    await expect(crikz.orderTypes(7)).to.be.reverted;
  });

  it("Should verify all 7 tiers have correct Fibonacci durations", async function () {
    const [owner] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(owner.address, owner.address);

    // FIXED: Use BigInt for all duration calculations
    const expectedDurations = [
      BigInt(5 * 86400),     // Tier 0: 5 days
      BigInt(13 * 86400),    // Tier 1: 13 days
      BigInt(34 * 86400),    // Tier 2: 34 days
      BigInt(89 * 86400),    // Tier 3: 89 days
      BigInt(233 * 86400),   // Tier 4: 233 days
      BigInt(610 * 86400),   // Tier 5: 610 days
      BigInt(1597 * 86400)   // Tier 6: 1597 days
    ];

    for (let i = 0; i < 7; i++) {
      const tier = await crikz.orderTypes(i);
      expect(tier.lockDuration).to.equal(expectedDurations[i], 
        `Tier ${i} duration mismatch`);
    }
  });

  it("Should verify all 7 tiers have correct reputation multipliers", async function () {
    const [owner] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(owner.address, owner.address);

    const expectedMultipliers = [
      618n * 10n**15n,   // Tier 0: 0.618x (φ - 1)
      787n * 10n**15n,   // Tier 1: 0.787x (√φ)
      1001n * 10n**15n,  // Tier 2: 1.001x
      1273n * 10n**15n,  // Tier 3: 1.273x
      1619n * 10n**15n,  // Tier 4: 1.619x (close to φ)
      2059n * 10n**15n,  // Tier 5: 2.059x
      2618n * 10n**15n   // Tier 6: 2.618x (φ²)
    ];

    for (let i = 0; i < 7; i++) {
      const tier = await crikz.orderTypes(i);
      expect(tier.reputationMultiplier).to.equal(expectedMultipliers[i], 
        `Tier ${i} multiplier mismatch`);
    }
  });
});