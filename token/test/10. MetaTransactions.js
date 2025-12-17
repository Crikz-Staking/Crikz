const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Meta-Transactions", function () {
  let crikz, user, forwarder, router;

  beforeEach(async function () {
    [_, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should process order via trusted forwarder", async function () {
    const amount = ethers.parseEther("100");
    const funcData = crikz.interface.encodeFunctionData("createOrder", [amount, 0]);
    const appendedData = ethers.solidityPacked(["bytes", "address"], [funcData, user.address]);

    await forwarder.sendTransaction({ to: await crikz.getAddress(), data: appendedData });
    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(1);
  });
});