const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Edge Cases: Extreme Scenarios", function () {
  let crikz, owner, user, whale, funder, forwarder, router;
  
  beforeEach(async function () {
    [owner, user, whale, funder, forwarder, router] = await ethers.getSigners();
    
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(forwarder.address, router.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("50000", 18));

    const ownerBalance = await crikz.balanceOf(owner.address);
    const whaleAmount = ownerBalance - ethers.parseUnits("100", 18);
    await crikz.connect(owner).transfer(whale.address, whaleAmount);
  });

  it("Should handle massive reputation calculations without overflowing", async function () {
    const whaleBal = await crikz.balanceOf(whale.address);
    await crikz.connect(whale).createOrder(whaleBal, 2);
    
    await crikz.connect(funder).fundProductionPool(ethers.parseUnits("10000", 18));
    await time.increase(365 * 24 * 60 * 60);

    await expect(crikz.connect(whale).claimYield()).to.not.be.reverted;
  });

  it("Should exhaust the pool balance through continuous claims", async function () {
    const exactFund = ethers.parseUnits("100", 18);
    await crikz.connect(funder).fundProductionPool(exactFund);

    await crikz.connect(user).createOrder(ethers.parseUnits("10000", 18), 2);
    
    await time.increase(50 * 365 * 24 * 60 * 60);await crikz.connect(user).claimYield();const fundAfterFirstClaim = await crikz.productionFund();const threshold = ethers.parseUnits("1", 18);
expect(fundAfterFirstClaim.balance).to.be.lt(threshold, "Pool was not sufficiently drained");
});it("Should drain the fund completely when theoretical yield exceeds balance", async function () {
await crikz.fundProductionPool(ethers.parseEther("5"));
await crikz.connect(user).createOrder(ethers.parseEther("500"), 4);await time.increase(100 * 365 * 24 * 60 * 60);const balanceBefore = await crikz.balanceOf(user.address);
await crikz.connect(user).claimYield();
const balanceAfter = await crikz.balanceOf(user.address);expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("5"), 1000000000n);const fund = await crikz.productionFund();
expect(fund.balance).to.be.lt(1000000000n);
});it("Should handle fund depletion and refunding correctly", async function () {
const [testOwner, testUser, testFunder] = await ethers.getSigners();
const Crikz = await ethers.getContractFactory("Crikz");
crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);await crikz.connect(testOwner).transfer(testUser.address, ethers.parseUnits("10000", 18));
await crikz.connect(testOwner).transfer(testFunder.address, ethers.parseUnits("10000", 18));await crikz.connect(testOwner).fundProductionPool(ethers.parseUnits("100", 18));await crikz.connect(testUser).createOrder(ethers.parseUnits("10000", 18), 4);await time.increase(50 * 365 * 24 * 60 * 60);await crikz.connect(testUser).claimYield();
let fund = await crikz.productionFund();
expect(fund.balance).to.be.lt(ethers.parseUnits("0.1", 18));await crikz.connect(testOwner).fundProductionPool(ethers.parseUnits("1000", 18));
fund = await crikz.productionFund();
expect(fund.balance).to.be.closeTo(ethers.parseUnits("1000", 18), ethers.parseUnits("0.1", 18));await time.increase(30 * 24 * 60 * 60);
await expect(crikz.connect(testUser).claimYield()).to.not.be.reverted;
});it("Should handle extreme fund-to-reputation ratios", async function () {
const [testOwner, testAlice] = await ethers.getSigners();
const Crikz = await ethers.getContractFactory("Crikz");
crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);await crikz.fundProductionPool(ethers.parseEther("100000000"));
await crikz.transfer(testAlice.address, ethers.parseEther("10"));
await crikz.connect(testAlice).createOrder(ethers.parseEther("1"), 0);await time.increase(365 * 24 * 60 * 60);const tx = await crikz.connect(testAlice).claimYield();
await expect(tx).to.emit(crikz, "YieldClaimed");
});it("Should prevent integer overflow in accumulated yield calculation", async function () {
const [testOwner, testUser] = await ethers.getSigners();
const Crikz = await ethers.getContractFactory("Crikz");
crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);await crikz.connect(testOwner).transfer(testUser.address, ethers.parseUnits("10000", 18));const hugeFund = ethers.parseUnits("100000000", 18);
await crikz.connect(testOwner).fundProductionPool(hugeFund);await crikz.connect(testUser).createOrder(ethers.parseUnits("10000", 18), 0);await time.increase(10 * 365 * 24 * 60 * 60);await expect(crikz.connect(testUser).claimYield()).to.not.be.reverted;const fund = await crikz.productionFund();
expect(fund.accumulatedYieldPerReputation).to.be.gt(0);
});
});