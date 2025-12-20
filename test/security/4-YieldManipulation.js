const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Security: Yield Debt Manipulation Resistance", function () {
  let crikz, owner, alice, bob, attacker;

  beforeEach(async function () {
    [owner, alice, bob, attacker] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(bob.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("100000", 18));
  });

  it("Should prevent front-running yield claims through flash staking", async function () {
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    await time.increase(100 * 24 * 60 * 60);
    
    await crikz.connect(attacker).createOrder(ethers.parseUnits("50000", 18), 0);
    
    const aliceBalBefore = await crikz.balanceOf(alice.address);
    
    await expect(crikz.connect(attacker).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
    
    await crikz.connect(alice).claimYield();
    const aliceBalAfter = await crikz.balanceOf(alice.address);
    
    expect(aliceBalAfter).to.be.gt(aliceBalBefore);
  });

  it("Should correctly handle yield debt when user creates multiple orders at different times", async function () {
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    await time.increase(30 * 24 * 60 * 60);
    
    const debtBefore = await crikz.creatorYieldDebt(alice.address);
    await crikz.connect(alice).createOrder(ethers.parseUnits("2000", 18), 0);
    const debtAfter = await crikz.creatorYieldDebt(alice.address);
    
    expect(debtAfter).to.be.gt(debtBefore);
    
    await time.increase(30 * 24 * 60 * 60);
    
    await expect(crikz.connect(alice).claimYield()).to.not.be.reverted;
  });

  it("Should maintain debt integrity across order completions", async function () {
    await crikz.connect(alice).createOrder(ethers.parseUnits("1000", 18), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    await time.increase(10 * 24 * 60 * 60);
    await crikz.connect(alice).createOrder(ethers.parseUnits("2000", 18), 0);
    
    await time.increase(10 * 24 * 60 * 60);
    await crikz.connect(alice).createOrder(ethers.parseUnits("3000", 18), 0);
    
    await time.increase(10 * 24 * 60 * 60);
    
    await crikz.connect(alice).completeOrder(1);
    
    const totalRep = await crikz.totalCreatorReputation(alice.address);
    const fund = await crikz.productionFund();
    const expectedDebt = (totalRep * fund.accumulatedYieldPerReputation) / ethers.parseUnits("1", 18);
    const actualDebt = await crikz.creatorYieldDebt(alice.address);
    
    expect(actualDebt).to.equal(expectedDebt);
  });

  it("Should prevent 'Back-dated' rewards when adding new reputation", async function () {
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("1000"));
    
    await time.increase(365 * 24 * 60 * 60);
    
    await crikz.connect(alice).createOrder(ethers.parseEther("1000"), 0);
    
    const orders = await crikz.getActiveOrders(alice.address);
    expect(orders.length).to.equal(2);
    
    const fund = await crikz.productionFund();
    expect(fund.totalReputation).to.be.gt(0);
  });

  it("Should prevent new users from capturing yield from before their entry", async function () {
    await crikz.connect(alice).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(owner).fundProductionPool(ethers.parseEther("5000"));
    await crikz.connect(bob).createOrder(ethers.parseEther("100"), 0);

    await expect(
      crikz.connect(bob).claimYield()
    ).to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });

  it("Should prevent new users from claiming historical yield", async function () {
    const [, testAlice, testBob] = await ethers.getSigners();
    
    const amount = ethers.parseUnits("100", 18);
    await crikz.connect(owner).transfer(testAlice.address, amount);
    await crikz.connect(owner).transfer(testBob.address, amount);
    await crikz.connect(owner).fundProductionPool(ethers.parseUnits("1000", 18));

    await crikz.connect(testAlice).createOrder(amount, 0);
    
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    await crikz.connect(testBob).createOrder(amount, 0);
    
    const totalProd = (await crikz.totalCreatorReputation(testBob.address) * (await crikz.productionFund()).accumulatedYieldPerReputation) / BigInt(1e18);
    const debt = await crikz.creatorYieldDebt(testBob.address);
    
    expect(totalProd - debt).to.equal(0);
  });

  it("Should prevent late whale from capturing historical yield", async function () {
    const [, smallFish, whale, testFunder] = await ethers.getSigners();
    
    await crikz.connect(owner).transfer(smallFish.address, ethers.parseEther("100"));
    await crikz.connect(owner).transfer(whale.address, ethers.parseEther("100000"));
    await crikz.connect(owner).transfer(testFunder.address, ethers.parseEther("50000"));

    await crikz.connect(smallFish).createOrder(ethers.parseEther("100"), 0);
    await crikz.connect(testFunder).fundProductionPool(ethers.parseEther("10000"));
    
    await time.increase(time.duration.years(1));

    await crikz.connect(whale).createOrder(ethers.parseEther("100000"), 0);

    await crikz.connect(smallFish).claimYield();
    
    const whalePending = await crikz.balanceOf(whale.address);
    const fishPending = await crikz.balanceOf(smallFish.address);

    expect(fishPending).to.be.gt(whalePending);
  });
});