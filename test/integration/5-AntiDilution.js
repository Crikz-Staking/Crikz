const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration: Anti-Dilution Mechanisms", function () {
  let crikz, owner, alice, newUser, router;

  beforeEach(async function () {
    [owner, alice, newUser, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Ensure 2 arguments match your constructor(address initialForwarder, address routerAddress)
    crikz = await Crikz.deploy(router.address, router.address);
    await crikz.waitForDeployment();

    await crikz.setLPPairAddress(router.address);
  });

  it("Should prevent new users from capturing yield from before their entry", async function () {
    const amount = ethers.parseEther("100");

    // 1. Alice creates an order to start yield generation
    await crikz.transfer(alice.address, amount);
    await crikz.connect(alice).createOrder(amount, 0);
    
    // Fund the pool to start accumulation
    await crikz.fundProductionPool(ethers.parseEther("1000"));
    
    // Advance time 10 days so Alice earns yield
    await time.increase(time.duration.days(10));

    // 2. NewUser joins AFTER the 10 days of accumulation
    await crikz.transfer(newUser.address, amount);
    await crikz.connect(newUser).createOrder(amount, 0);

    /** * ANTI-DILUTION CHECK:
     * Immediately after joining, newUser's yieldDebt should equal their entitlement.
     * Attempting to claim must revert with NoProductsToClaim.
     */
    await expect(crikz.connect(newUser).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });
});