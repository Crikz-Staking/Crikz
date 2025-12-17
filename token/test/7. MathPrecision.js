const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Math", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should calculate reputation correctly (0.618x)", async function () {
    const amount = ethers.parseEther("1000");
    await crikz.connect(user).createOrder(amount, 0);
    const orders = await crikz.getActiveOrders(user.address);
    expect(orders[0].reputation).to.equal(ethers.parseEther("618"));
  });
});