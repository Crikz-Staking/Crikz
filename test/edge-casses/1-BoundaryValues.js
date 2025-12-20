const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Edge Cases: Boundary Values", function () {
  let crikz, owner, user, forwarder, router;

  beforeEach(async function () {
    [owner, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should revert if creating an order with 0 amount (CrikzMath: InvalidAmount)", async function () {
    await expect(
      crikz.createOrder(0, 0)
    ).to.be.reverted;
  });

  it("Should handle 1-wei stakes and calculate 0.618 correctly", async function () {
    const [testOwner, testUser] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(testOwner).deploy(ethers.ZeroAddress, testOwner.address);

    const initialFunding = ethers.parseUnits("1", 18);
    await crikz.connect(testOwner).transfer(testUser.address, initialFunding);

    await crikz.connect(testUser).createOrder(1n, 0);
    
    let orders = await crikz.getActiveOrders(testUser.address);
    expect(orders[0].reputation).to.equal(0n);
    
    await crikz.connect(testUser).createOrder(1000n, 0);
    
    orders = await crikz.getActiveOrders(testUser.address);
    expect(orders[1].reputation).to.equal(618n);
  });

  it("Should revert when accessing an Order Type that does not exist", async function () {
    await expect(
      crikz.connect(user).createOrder(ethers.parseUnits("100", 18), 255)
    ).to.be.revertedWithCustomError(crikz, "InsufficientOrderType");
  });
});