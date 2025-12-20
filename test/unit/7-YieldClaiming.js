const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Unit: Yield Claiming", function () {
  let crikz, owner, user, funder;

  beforeEach(async function () {
    [owner, user, funder] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.connect(owner).deploy(ethers.ZeroAddress, owner.address);
    await crikz.waitForDeployment();
    
    await crikz.connect(owner).transfer(user.address, ethers.parseUnits("10000", 18));
    await crikz.connect(owner).transfer(funder.address, ethers.parseUnits("100000", 18));
  });

  describe("Basic Yield Claims", function () {
    it("Should allow claiming yield after time passage", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
      await time.increase(30 * 24 * 60 * 60);
      await expect(crikz.connect(user).claimYield()).to.emit(crikz, "YieldClaimed");
    });

    it("Should revert when claiming with no pending yield", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("1000"));
      
      await expect(crikz.connect(user).claimYield())
        .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
    });

    it("Should update yield debt after claiming", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
      await time.increase(30 * 24 * 60 * 60);
      
      const debtBefore = await crikz.creatorYieldDebt(user.address);
      await crikz.connect(user).claimYield();
      const debtAfter = await crikz.creatorYieldDebt(user.address);
      
      expect(debtAfter).to.be.gt(debtBefore);
    });
  });

  describe("Yield Safety Caps", function () {
    it("Should cap yieldAccrued at the current fund balance (Safety Cap)", async function () {
      const smallFund = ethers.parseEther("10");
      await crikz.connect(owner).fundProductionPool(smallFund);
      
      await crikz.connect(user).createOrder(ethers.parseEther("1000"), 4);

      await time.increase(100 * 365 * 24 * 60 * 60);
      await crikz.connect(user).claimYield();
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.be.lt(10000n);
    });

    it("Should never distribute more than available fund balance", async function () {
      await crikz.connect(owner).fundProductionPool(ethers.parseEther("10"));
      await crikz.connect(user).createOrder(ethers.parseEther("500"), 4);

      await time.increase(50 * 365 * 24 * 60 * 60);

      const initialBal = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const finalBal = await crikz.balanceOf(user.address);

      expect(finalBal - initialBal).to.be.closeTo(ethers.parseEther("10"), ethers.parseEther("0.01"));
      
      const fund = await crikz.productionFund();
      expect(fund.balance).to.be.lt(1000000000n);
    });
  });

  describe("Multiple Claims", function () {
    it("Should allow multiple claims over time", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("1000"), 0);
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("10000"));
      
      await time.increase(30 * 24 * 60 * 60);
      await crikz.connect(user).claimYield();
      
      await time.increase(30 * 24 * 60 * 60);
      await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
    });

    it("Should accumulate yield correctly between claims", async function () {
      // Create order with smaller amount to avoid balance issues
      await crikz.connect(user).createOrder(ethers.parseEther("500"), 0);
      
      // Fund pool with sufficient tokens
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("50000"));
      
      await time.increase(10 * 24 * 60 * 60);
      const balBefore1 = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter1 = await crikz.balanceOf(user.address);
      const yield1 = balAfter1 - balBefore1;
      
      await time.increase(10 * 24 * 60 * 60);
      const balBefore2 = await crikz.balanceOf(user.address);
      await crikz.connect(user).claimYield();
      const balAfter2 = await crikz.balanceOf(user.address);
      const yield2 = balAfter2 - balBefore2;
      
      expect(yield2).to.be.closeTo(yield1, ethers.parseEther("0.5"));
    });
  });

  describe("Edge Cases", function () {
    it("Should handle claiming when fund is empty", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      
      await expect(crikz.connect(user).claimYield())
        .to.be.revertedWithCustomError(crikz, "NoProductsToClaim");
    });

    it("Should handle claiming with multiple active orders", async function () {
      await crikz.connect(user).createOrder(ethers.parseEther("100"), 0);
      await crikz.connect(user).createOrder(ethers.parseEther("200"), 0);
      await crikz.connect(funder).fundProductionPool(ethers.parseEther("5000"));
      
      await time.increase(30 * 24 * 60 * 60);
      
      await expect(crikz.connect(user).claimYield()).to.not.be.reverted;
    });
  });
});