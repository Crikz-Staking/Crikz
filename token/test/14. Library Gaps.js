const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("Crikz - Library Deep Dive & Branch Coverage", function () {
  let crikz;
  let owner;
  let funder;
  let forwarder;
  let router;

  beforeEach(async function () {
    [owner, funder, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.waitForDeployment();
    
    // Initial funding for the test
    await crikz.transfer(funder.address, ethers.parseEther("10000"));
  });

  it("Should handle zero time elapsed in ProductionDistributor (Same Block Transactions)", async function () {
    // 1. Setup: First funding to set lastUpdateTime
    await crikz.connect(funder).fundProductionPool(ethers.parseEther("100"));

    // 2. Disable automining to force multiple transactions into a single block
    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);

    // 3. Send two transactions that will share the same block.timestamp
    const tx1 = await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));
    const tx2 = await crikz.connect(funder).fundProductionPool(ethers.parseEther("10"));

    // 4. Manually mine the block containing both transactions
    await network.provider.send("evm_mine");

    // 5. Re-enable automining for subsequent tests
    await network.provider.send("evm_setAutomine", [true]);

    // 6. Verify neither transaction reverted
    await expect(tx1).to.not.be.reverted;
    await expect(tx2).to.not.be.reverted;

    // 7. Verify the fund balance updated correctly (100 + 10 + 10)
    const fund = await crikz.productionFund();
    expect(fund.balance).to.equal(ethers.parseEther("120"));
  });
}); // This was likely the missing closing brace causing your error