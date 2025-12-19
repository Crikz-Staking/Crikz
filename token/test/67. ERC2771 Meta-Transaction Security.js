const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - ERC2771 Meta-Transaction Security", function () {
  let crikz, owner, trustedForwarder, user, attacker;

  beforeEach(async function () {
    [owner, trustedForwarder, user, attacker] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(trustedForwarder.address, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));
    await crikz.connect(owner).transfer(attacker.address, ethers.parseUnits("1000", 18));
  });

  it("Should correctly extract sender from trusted forwarder calldata", async function () {
    const amount = ethers.parseUnits("100", 18);
    const orderType = 0;
    
    // Encode the function call
    const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, orderType]);
    
    // Append user address (ERC2771 format)
    const dataWithSender = ethers.solidityPacked(
      ["bytes", "address"],
      [functionData, user.address]
    );
    
    // Send from trusted forwarder
    await trustedForwarder.sendTransaction({
      to: await crikz.getAddress(),
      data: dataWithSender
    });
    
    // Verify order was created for the correct user
    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(1);
    expect(orders[0].amount).to.equal(amount);
    
    // Verify forwarder doesn't have the order
    const forwarderOrders = await crikz.getActiveOrders(trustedForwarder.address);
    expect(forwarderOrders.length).to.equal(0);
  });

  it("Should reject spoofed sender from non-trusted forwarder", async function () {
    const amount = ethers.parseUnits("100", 18);
    const orderType = 0;
    
    // Attacker tries to spoof user's address
    const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, orderType]);
    const spoofedData = ethers.solidityPacked(
      ["bytes", "address"],
      [functionData, user.address]
    );
    
    // Send from attacker (not trusted forwarder)
    await attacker.sendTransaction({
      to: await crikz.getAddress(),
      data: spoofedData
    });
    
    // Order should belong to attacker, not user
    const userOrders = await crikz.getActiveOrders(user.address);
    expect(userOrders.length).to.equal(0);
    
    const attackerOrders = await crikz.getActiveOrders(attacker.address);
    expect(attackerOrders.length).to.equal(1);
  });

  it("Should handle malformed calldata gracefully", async function () {
    // Send malformed data
    const malformedData = "0x1234567890";
    
    await expect(
      trustedForwarder.sendTransaction({
        to: await crikz.getAddress(),
        data: malformedData
      })
    ).to.be.reverted;
  });
});