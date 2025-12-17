const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Balance Audit", function () {
  it("Identify the Token Holder", async function () {
    const [owner, other] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // Deploy with owner as the forwarder for testing
    const crikz = await Crikz.deploy(owner.address, owner.address);

    const ownerBal = await crikz.balanceOf(owner.address);
    const contractBal = await crikz.balanceOf(await crikz.getAddress());
    
    console.log("------------------------------------------");
    console.log("DEPLOYER ADDRESS:", owner.address);
    console.log("OWNER BALANCE:   ", ethers.formatUnits(ownerBal, 18));
    console.log("CONTRACT BALANCE:", ethers.formatUnits(contractBal, 18));
    console.log("------------------------------------------");

    expect(ownerBal).to.be.gt(0, "The owner is broke! Check Crikz.sol constructor.");
  });
});