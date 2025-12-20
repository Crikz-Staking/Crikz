const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contracts: Crikz - Unused Functions Coverage", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  describe("setProductionFundForTest - Lines 86-89 Coverage", function () {
    it("Should allow owner to set production fund for testing", async function () {
      const testBalance = ethers.parseEther("1000");
      const testAYPR = ethers.parseEther("0.5");
      const testTime = 1234567890;
      const testReputation = ethers.parseEther("500");
      
      // Line 86-89: Set all fund parameters
      await crikz.connect(owner).setProductionFundForTest(
        testBalance,
        testAYPR,
        testTime,
        testReputation
      );
      
      const fund = await crikz.productionFund();
      
      expect(fund.balance).to.equal(testBalance);
      expect(fund.accumulatedYieldPerReputation).to.equal(testAYPR);
      expect(fund.lastUpdateTime).to.equal(testTime);
      expect(fund.totalReputation).to.equal(testReputation);
    });

    it("Should only allow owner to call setProductionFundForTest", async function () {
      await expect(
        crikz.connect(user).setProductionFundForTest(100, 200, 300, 400)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow setting all values to zero", async function () {
      await crikz.connect(owner).setProductionFundForTest(0, 0, 0, 0);
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.equal(0);
      expect(fund.accumulatedYieldPerReputation).to.equal(0);
      expect(fund.lastUpdateTime).to.equal(0);
      expect(fund.totalReputation).to.equal(0);
    });

    it("Should allow setting very large values", async function () {
      const maxUint = ethers.MaxUint256;
      
      await crikz.connect(owner).setProductionFundForTest(
        maxUint,
        maxUint,
        maxUint,
        maxUint
      );
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.equal(maxUint);
    });

    it("Should enable testing specific yield scenarios", async function () {
      // Setup a specific yield state for testing
      await crikz.connect(user).createOrder(ethers.parseEther("1000"), 0);
      
      // Manually set fund to a known state
      await crikz.connect(owner).setProductionFundForTest(
        ethers.parseEther("5000"),
        ethers.parseEther("1"), // 1 token per reputation
        await ethers.provider.getBlock('latest').then(b => b.timestamp),
        ethers.parseEther("618") // User's reputation
      );
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.equal(ethers.parseEther("5000"));
    });
  });

  describe("_msgData override - Line 245 Coverage", function () {
    it("Should correctly handle _msgData in normal calls", async function () {
      // _msgData is called internally by ERC2771Context
      // We test it by making a normal call
      await expect(
        crikz.connect(user).createOrder(ethers.parseEther("100"), 0)
      ).to.not.be.reverted;
      
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders.length).to.equal(1);
    });

    it("Should handle _msgData with meta-transaction context", async function () {
      // Deploy with actual forwarder
      const [testOwner, forwarder, testUser] = await ethers.getSigners();
      const Crikz = await ethers.getContractFactory("Crikz");
      const crikzWithForwarder = await Crikz.connect(testOwner).deploy(
        forwarder.address,
        testOwner.address
      );
      await crikzWithForwarder.waitForDeployment();
      
      await crikzWithForwarder.connect(testOwner).transfer(
        testUser.address,
        ethers.parseEther("1000")
      );
      
      // Create order through forwarder (tests _msgData override)
      const amount = ethers.parseEther("100");
      const functionData = crikzWithForwarder.interface.encodeFunctionData(
        "createOrder",
        [amount, 0]
      );
      
      const dataWithSender = ethers.solidityPacked(
        ["bytes", "address"],
        [functionData, testUser.address]
      );
      
      await forwarder.sendTransaction({
        to: await crikzWithForwarder.getAddress(),
        data: dataWithSender
      });
      
      // Verify order was created for testUser (proves _msgData worked)
      const orders = await crikzWithForwarder.getActiveOrders(testUser.address);
      expect(orders.length).to.equal(1);
    });

    it("Should handle empty calldata correctly", async function () {
      // Test _msgData with view functions (which use calldata)
      const orders = await crikz.getActiveOrders(user.address);
      expect(orders).to.be.an('array');
});
});
});
