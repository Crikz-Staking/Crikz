const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Edge Cases: Zero States", function () {
  let crikz, funder, forwarder, router;

  beforeEach(async function () {
    [_, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(funder.address, ethers.parseEther("1000"));
  });

  it("Should return 0 yield accrued when totalReputation is 0", async function () {
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("500"));
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));
    
    const fund = await crikz.productionFund();
    expect(fund.accumulatedYieldPerReputation).to.equal(0);
  });

  it("Should revert when creating an order with 0 amount", async function () {
    await expect(
      crikz.connect(funder).createOrder(0, 0)
    ).to.be.revertedWithCustomError(crikz, "InvalidAmount");
  });

  it("Should return zero yield when totalReputation is zero", async function () {
    const [testOwner, testUser] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    await crikz.fundProductionPool(ethers.parseEther("1000"));
    
    const fund = await crikz.productionFund();
    expect(fund.totalReputation).to.equal(0);
    
    await expect(crikz.connect(testUser).claimYield())
      .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
  });
});