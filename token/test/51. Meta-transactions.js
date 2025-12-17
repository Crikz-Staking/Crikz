const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Meta-Transactions (ERC2771)", function () {
  it("Should identify the correct user through a trusted forwarder", async function () {
    const [owner, forwarder, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    
    // Set 'forwarder' as the initialForwarder
    const crikz = await Crikz.deploy(forwarder.address, owner.address);

    // Fund the user through the owner
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("100", 18));

    // Manually craft a call to createOrder as if it came from the forwarder
    const amount = ethers.parseUnits("10", 18);
    const orderType = 0;
    const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, orderType]);
    
    // Append user address to end of calldata (ERC2771 standard)
    const pendedData = ethers.solidityPacked(["bytes", "address"], [functionData, user.address]);

    await forwarder.sendTransaction({
      to: await crikz.getAddress(),
      data: pendedData
    });

    const orders = await crikz.getActiveOrders(user.address);
    expect(orders.length).to.equal(1);
    expect(await crikz.balanceOf(user.address)).to.equal(ethers.parseUnits("90", 18));
  });
});