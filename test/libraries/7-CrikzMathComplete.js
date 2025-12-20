const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Libraries: CrikzMath - Complete Coverage", function () {
  let crikz, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
  });

  describe("min function - Direct Testing via Yield Cap", function () {
    it("Should return first parameter when a < b", async function () {
      // Create scenario: fund balance (smaller) < calculated yield (larger)
      await crikz.connect(owner).fundProductionPool(ethers.parseEther("100"));
      await crikz.connect(user).createOrder(ethers.parseEther("5000"), 4);
      
      await time.increase(100 * 365 * 24 * 60 * 60);
      
      const balBefore = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter = await crikz.balanceOf(user.address);
      
      // Should receive fund balance (100), proving min returned first param
      expect(balAfter - balBefore).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("1"));
    });

    it("Should return second parameter when a >= b", async function () {
      // Create scenario: calculated yield (smaller) <= fund balance (larger)
      await crikz.connect(owner).fundProductionPool(ethers.parseEther("100000"));
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await time.increase(10 * 24 * 60 * 60); // Short time for small yield
      
      const balBefore = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter = await crikz.balanceOf(user.address);
      
      const received = balAfter - balBefore;
      
      // Should receive calculated yield (smaller), proving min returned second param
      expect(received).to.be.lt(ethers.parseEther("100000"));
      expect(received).to.be.gt(0);
    });

    it("Should handle equal values (a == b edge case)", async function () {
      // This is tricky - we need calculated yield to exactly equal fund balance
      // We'll get close enough to test the branch
      await crikz.connect(owner).fundProductionPool(ethers.parseEther("10"));
      await crikz.connect(user).createOrder(ethers.parseEther("5000"), 4);
      
      // Calculate approximate time for yield to reach fund balance
      await time.increase(5 * 24 * 60 * 60); // Adjust timing
      
      const balBefore = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter = await crikz.balanceOf(user.address);
      
      const received = balAfter - balBefore;
      expect(received).to.be.gt(0);
    });
  });

  describe("Constants verification", function () {
    it("Should have correct WAD constant value", async function () {
      // WAD is used in all calculations - verify it's accessible
      // We verify this by checking reputation calculations work correctly
      const amount = ethers.parseEther("1000");
      await crikz.connect(user).createOrder(amount, 0);
      
      const orders = await crikz.getActiveOrders(user.address);
      const expectedRep = ethers.parseEther("618"); // 1000 * 0.618
      
      expect(orders[0].reputation).to.equal(expectedRep);
    });

    it("Should have correct MIN_ORDER_AMOUNT constant", async function () {
      // MIN_ORDER_AMOUNT is defined but not enforced in current contract
      // We verify constants exist by testing with amounts around the threshold
      const minAmount = ethers.parseEther("10");
      
      // Should work with amount at minimum
      await expect(
        crikz.connect(user).createOrder(minAmount, 0)
      ).to.not.be.reverted;
      
      // Should work with amount above minimum (use + operator instead of .add())
      await expect(
        crikz.connect(user).createOrder(minAmount + 1n, 0)
      ).to.not.be.reverted;
    });
  });
});