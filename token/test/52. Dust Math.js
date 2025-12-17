const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Dust and Rounding Math", function () {
  it("Should handle 1-wei stakes and calculate 0.618 correctly", async function () {
    const [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    // Deploy with ZeroAddress to ensure owner gets INITIAL_SUPPLY
    const crikz = await Crikz.deploy(ethers.ZeroAddress, owner.address);

    // INCREASE FUNDING: Give the user 1 ether (10^18 wei) so they never run out
    const initialFunding = ethers.parseUnits("1", 18);
    await crikz.connect(owner).transfer(user.address, initialFunding); 

    // Stake 1 wei
    await crikz.connect(user).createOrder(1n, 0);
    
    let orders = await crikz.getActiveOrders(user.address);
    
    // 1 * 618 / 1000 = 0 (Solidity integer floor)
    expect(orders[0].reputation).to.equal(0n);
    
    // Stake 1000 wei
    // User now has (initialFunding - 1) wei, which is plenty for 1000 wei
    await crikz.connect(user).createOrder(1000n, 0);
    
    orders = await crikz.getActiveOrders(user.address);
    
    // 1000 * 618 / 1000 = 618
    expect(orders[1].reputation).to.equal(618n);
  });
});