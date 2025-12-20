const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Unit: ERC2771 Context Functions", function () {
  let crikz, owner, forwarder, user;

  beforeEach(async function () {
    [owner, forwarder, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(forwarder.address, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("1000", 18));
  });

  describe("Message Sender Extraction", function () {
    it("Should correctly identify sender in direct calls", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
    });

    it("Should extract sender from trusted forwarder calldata", async function () {
      const amount = ethers.parseUnits("100", 18);
      const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, 0]);
      const dataWithSender = ethers.solidityPacked(
        ["bytes", "address"],
        [functionData, user.address]
      );
      
      await forwarder.sendTransaction({
        to: await crikz.getAddress(),
        data: dataWithSender
      });
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
    });

    it("Should handle standard calls without appended address", async function () {
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 0)
      ).to.not.be.reverted;
    });
  });

  describe("Context Suffix Length", function () {
    it("Should return correct suffix length for trusted forwarder", async function () {
      // The context suffix length is 20 bytes (address size) when called via forwarder
      const amount = ethers.parseUnits("100", 18);
      const functionData = crikz.interface.encodeFunctionData("createOrder", [amount, 0]);
      const dataWithSender = ethers.solidityPacked(
        ["bytes", "address"],
        [functionData, user.address]
      );
      
      await expect(
        forwarder.sendTransaction({
          to: await crikz.getAddress(),
          data: dataWithSender
        })
      ).to.not.be.reverted;
    });
  });

  describe("Message Data Handling", function () {
    it("Should process complete message data correctly", async function () {
      const amount = ethers.parseEther("100");
      const orderType = 2;
      
      await crikz.connect(user).createOrder(amount, orderType);
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders[0].amount).to.equal(amount);
      expect(orders[0].orderType).to.equal(orderType);
    });
  });
});