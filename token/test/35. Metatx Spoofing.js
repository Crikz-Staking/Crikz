const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Meta-Transaction Identity", function () {
  let crikz, attacker, victim, forwarder, router;

  beforeEach(async function () {
    [_, attacker, victim, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    // CRITICAL: Give attacker tokens so they can attempt the order
    await crikz.transfer(attacker.address, ethers.parseEther("1000"));
  });

  it("Should ignore appended address data if not sent via trusted forwarder", async function () {
    const amount = ethers.parseEther("100");
    const data = crikz.interface.encodeFunctionData("createOrder", [amount, 0]);
    // Attacker appends victim's address to the end of the calldata
    const spoofedData = ethers.solidityPacked(["bytes", "address"], [data, victim.address]);

    // Attacker sends directly to contract (not through the trusted forwarder)
    await attacker.sendTransaction({
        to: await crikz.getAddress(),
        data: spoofedData
    });

    // Verify: The order belongs to the attacker, NOT the victim
    const victimOrders = await crikz.getActiveOrders(victim.address);
    expect(victimOrders.length).to.equal(0);
    
    const attackerOrders = await crikz.getActiveOrders(attacker.address);
    expect(attackerOrders.length).to.equal(1);
  });
}); // This closing tag fixes your SyntaxError