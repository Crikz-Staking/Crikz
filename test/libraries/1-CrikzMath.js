const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Libraries: CrikzMath", function () {
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

  it("Should calculate accurate 0.618x reputation across all 7 tiers", async function () {
    const [owner, testUser] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);

    await crikz.connect(owner).transfer(testUser.address, ethers.parseUnits("1000", 18));
    const smallAmount = ethers.parseUnits("10", 18);
    
    await crikz.connect(testUser).createOrder(smallAmount, 0);
    const orders = await crikz.getActiveOrders(testUser.address);
    
    const expected = ethers.parseUnits("6.18", 18);
    expect(orders[0].reputation).to.equal(expected);
  });
});