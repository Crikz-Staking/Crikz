const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Reputation Multiplier Logic", function () {
  it("Should apply fixed multiplier regardless of user balance", async function () {
    const [owner, alice] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    const stakeAmount = ethers.parseUnits("500", 18);
    // Fund Alice from the owner's initial supply
    await crikz.connect(owner).transfer(alice.address, ethers.parseUnits("1000", 18));

    await crikz.connect(alice).createOrder(stakeAmount, 3);
    const orders = await crikz.getActiveOrders(alice.address);
    
    const expectedReputation = (stakeAmount * 618n) / 1000n;
    expect(orders[0].reputation).to.equal(expectedReputation);
  });
});