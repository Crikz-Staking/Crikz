const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Security: Meta-Transactions (ERC2771)", function () {
  let crikz, owner, trustedForwarder, user, attacker;

  beforeEach(async function () {
    [owner, trustedForwarder, user, attacker] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Deploy with trustedForwarder (not zero address)
    crikz = await Crikz.connect(owner).deploy(trustedForwarder.address, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("1000", 18));
  });

  it("Should correctly extract sender from trusted forwarder calldata", async function () {
    const amount = ethers.parseUnits("100", 18);
    const orderType = 0;
    
    const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, orderType]);
    
    const dataWithSender = ethers.solidityPacked(
      ["bytes", "address"],
      [functionData, user.address]
    );
    
    await trustedForwarder.sendTransaction({
      to: await crikz.getAddress(),
      data: dataWithSender
    });
    
    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(1);
    expect(orders[0].amount).to.equal(amount);
    
    const forwarderOrders = await crikz.getActiveOrders(trustedForwarder.address);
    expect(forwarderOrders.length).to.equal(0);
  });

  it("Should reject spoofed sender from non-trusted forwarder", async function () {
    const amount = ethers.parseUnits("100", 18);
    const orderType = 0;
    
    const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, orderType]);
    const spoofedData = ethers.solidityPacked(
      ["bytes", "address"],
      [functionData, user.address]
    );
    
    await attacker.sendTransaction({
      to: await crikz.getAddress(),
      data: spoofedData
    });
    
    const userOrders = await crikz.getActiveOrders(user.address);
    expect(userOrders.length).to.equal(0);
    
    const attackerOrders = await crikz.getActiveOrders(attacker.address);
    expect(attackerOrders.length).to.equal(1);
  });

  it("Should handle malformed calldata gracefully", async function () {
    const malformedData = "0x1234567890";
    
    await expect(
      trustedForwarder.sendTransaction({
        to: await crikz.getAddress(),
        data: malformedData
      })
    ).to.be.reverted;
  });
});