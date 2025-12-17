const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crikz - Token Infrastructure", function () {
  it("Should confirm owner received INITIAL_SUPPLY", async function () {
    const [owner] = await ethers.getSigners();
    const Crikz = await ethers.getContractFactory("Crikz");
    const crikz = await Crikz.deploy(owner.address, owner.address);

    const balance = await crikz.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseUnits("1000000000", 18)); 
  });
});