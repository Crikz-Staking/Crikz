const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: ProductionDistributor", function () {
  let crikz, owner, funder, forwarder, router;

  beforeEach(async function () {
    [owner, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
    
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should handle zero time elapsed in ProductionDistributor (Same Block Transactions)", async function () {
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("100"));

    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);

    const tx1 = await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));
    const tx2 = await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));

    await network.provider.send("evm_mine");

    await network.provider.send("evm_setAutomine", [true]);

    await expect(tx1).to.not.be.reverted;
    await expect(tx2).to.not.be.reverted;

    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(ethers.parseEther("120"));
  });

  it("Should handle zero-time updates (Multiple Tx in Same Block)", async function () {
    const fundAmount = ethers.parseUnits("100", 18);
    
    await crikz.connect(funder).fundProductionPool(fundAmount);

    await network.provider.send("evm_setAutomine", [false]);

    await crikz.connect(funder).fundProductionPool(fundAmount);
    await crikz.connect(funder).fundProductionPool(fundAmount);

    await network.provider.send("evm_mine");
    await network.provider.send("evm_setAutomine", [true]);

    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(ethers.parseUnits("300", 18));
  });

  it("Should handle concurrent funding and claiming correctly", async function () {
    const [testOwner, testUser] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);
    
    await crikz.connect(testOwner).transfer(testUser.address, ethers.parseUnits("10000", 18));

    await crikz.connect(testOwner).fundProductionPool(ethers.parseUnits("10000", 18));
    
    await crikz.connect(testUser).createOrder(ethers.parseUnits("5000", 18), 0);
    
    await time.increase(30 * 24 * 60 * 60);
    
    const fundBefore = await crikz.productionFund();
    
    await crikz.connect(testOwner).fundProductionPool(ethers.parseUnits("5000", 18));
    
    await crikz.connect(testUser).claimYield();
    
    const fundAfter = await crikz.productionFund();
    expect(fundAfter.lastUpdateTime).to.be.gte(fundBefore.lastUpdateTime);
    expect(fundAfter.balance).to.be.gt(0);
  });
});