const { ethers } = require("hardhat");

/**
 * @notice Helper function to deploy Crikz with standard test configuration
 * @dev Uses ZeroAddress for forwarder to simplify testing
 * @return Deployed contract instance and signer array
 */
async function deployWithStandardSetup() {
  const [owner, ...users] = await ethers.getSigners();
  const Crikz = await ethers.getContractFactory("Crikz");
  const crikz = await Crikz.connect(owner).deploy(
    ethers.ZeroAddress, 
    owner.address
  );
  await crikz.waitForDeployment();
  
  return { crikz, owner, users };
}

/**
 * @notice Funds multiple users from owner's balance
 * @param crikz The contract instance
 * @param owner Owner address with tokens
 * @param users Array of user addresses to fund
 * @param amount Amount to send each user
 */
async function fundUsers(crikz, owner, users, amount) {
  for (const user of users) {
    await crikz.connect(owner).transfer(user.address, amount);
  }
}

/**
 * @notice Creates multiple orders for a user
 * @param crikz The contract instance
 * @param user User creating orders
 * @param orderCount Number of orders to create
 * @param amount Amount per order
 * @param orderType Order type (0-6)
 */
async function createMultipleOrders(crikz, user, orderCount, amount, orderType = 0) {
  for (let i = 0; i < orderCount; i++) {
    await crikz.connect(user).createOrder(amount, orderType);
  }
}

module.exports = {
  deployWithStandardSetup,
  fundUsers,
  createMultipleOrders
};