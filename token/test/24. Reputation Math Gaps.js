const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Reputation Math Verification", function () {
  it("Should calculate accurate reputation for all 7 order types", async function () {
    const [owner, tester] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // Pass ZeroAddress to ensure owner receives INITIAL_SUPPLY
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const stakeAmount = ethers.parseUnits("1000", 18);
    // Explicitly fund the tester from the owner
    await crikz.connect(owner).transfer(tester.address, ethers.parseUnits("10000", 18));

    for (let i = 0; i < 7; i++) {
      await crikz.connect(tester).createOrder(stakeAmount, i);
      const orders = await crikz.getActiveOrders(tester.address);
      const expectedRep = (stakeAmount * 618n) / 1000n;
      expect(orders[i].reputation).to.equal(expectedRep);
    }
  });
});