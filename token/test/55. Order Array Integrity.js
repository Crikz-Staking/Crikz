const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Order Manager Swap-and-Pop", function () {
  it("Should maintain array integrity when removing middle elements", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Use ZeroAddress for deployment
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));

    await crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("20", 18), 0);
    await crikz.connect(user).createOrder(ethers.parseUnits("30", 18), 0);

    await ethers.provider.send("evm_increaseTime", [86401]); 
    await ethers.provider.send("evm_mine");

    // Remove middle order; triggers OrderManager.removeOrder logic
    await crikz.connect(user).completeOrder(1);

    const activeOrders = await crikz.getActiveOrders(user.address);
    expect(activeOrders.length).to.equal(2);
    expect(activeOrders[0].amount).to.equal(ethers.parseUnits("10", 18));
    expect(activeOrders[1].amount).to.equal(ethers.parseUnits("30", 18));
  });
});