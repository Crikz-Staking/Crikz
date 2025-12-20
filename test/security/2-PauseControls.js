const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Security: Pause Control", function () {
  let crikz, owner, user, forwarder, router;

  beforeEach(async function () {
    [owner, user, forwarder, router] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    crikz = await Crikz.deploy(forwarder.address, router.address);
    await crikz.transfer(user.address, ethers.parseEther("1000"));
  });

  it("Should allow the owner to emergency pause and prevent funding", async function () {
    await crikz.pause();
    
    const amount = ethers.parseUnits("10", 18);
    await expect(crikz.fundProductionPool(amount)).to.be.revertedWith("Pausable: paused");
    
    await crikz.unpause();
    await crikz.transfer(user.address, amount);
    await expect(crikz.connect(user).fundProductionPool(amount)).to.not.be.reverted;
  });

  it("Should strictly enforce PAUSE on all user actions", async function () {
    const amount = ethers.parseUnits("100", 18);
    await crikz.connect(user).createOrder(amount, 0);
    
    await crikz.connect(owner).pause();

    await expect(
      crikz.connect(user).createOrder(amount, 0)
    ).to.be.revertedWith("Pausable: paused");

    await expect(
      crikz.connect(user).claimYield()
    ).to.be.revertedWith("Pausable: paused");

    await time.increase(10 * 24 * 60 * 60);
    await expect(
      crikz.connect(user).completeOrder(0)
    ).to.be.revertedWith("Pausable: paused");

    await expect(
      crikz.connect(user).fundProductionPool(amount)
    ).to.be.revertedWith("Pausable: paused");
  });

  it("Should allow full recovery after UNPAUSE", async function () {
    await crikz.connect(owner).pause();
    await crikz.connect(owner).unpause();

    const amount = ethers.parseUnits("100", 18);
    await expect(
      crikz.connect(user).createOrder(amount, 0)
    ).to.not.be.reverted;
  });

  it("Should block ALL state-changing functions when paused", async function () {
    const amount = ethers.parseUnits("100", 18);
    await crikz.connect(user).createOrder(amount, 0);
    await crikz.connect(owner).pause();

    await expect(crikz.connect(user).createOrder(amount, 0)).to.be.revertedWith("Pausable: paused");
    await expect(crikz.connect(user).fundProductionPool(amount)).to.be.revertedWith("Pausable: paused");
    await expect(crikz.connect(user).claimYield()).to.be.revertedWith("Pausable: paused");
    
    await time.increase(100 * 24 * 60 * 60);
    await expect(crikz.connect(user).completeOrder(0)).to.be.revertedWith("Pausable: paused");

    await crikz.connect(owner).unpause();
    await expect(crikz.connect(user).completeOrder(0)).to.not.be.reverted;
  });

  it("Should prevent creating orders when paused", async function () {
    await crikz.pause();
    const amount = ethers.parseUnits("10", 18);
    await expect(crikz.connect(owner).createOrder(amount, 0))
      .to.be.revertedWith("Pausable: paused");
  });

  it("Should block createOrder when paused", async function () {
    await crikz.pause();
    await expect(
      crikz.connect(user).createOrder(ethers.parseEther("100"), 0)
    ).to.be.reverted;
  });

  it("Should prevent orders and claims when paused", async function () {
    await crikz.transfer(user.address, ethers.parseUnits("100", 18));
    await crikz.pause();

    await expect(
      crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0)
    ).to.be.revertedWith("Pausable: paused");

    await expect(
      crikz.connect(user).claimYield()
    ).to.be.revertedWith("Pausable: paused");

    await crikz.unpause();
    await expect(
      crikz.connect(user).createOrder(ethers.parseUnits("10", 18), 0)
    ).to.not.be.reverted;
  });
});