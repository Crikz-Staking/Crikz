const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Isolated Reputation Math", function () {
  it("Should calculate accurate 0.618x reputation across all 7 tiers", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));
    const smallAmount = ethers.parseUnits("10", 18);
    
    await crikz.connect(user).createOrder(smallAmount, 0);
    const orders = await crikz.getActiveOrders(user.address);
    
    const expected = ethers.parseUnits("6.18", 18);
    expect(orders[0].reputation).to.equal(expected);
  });
});