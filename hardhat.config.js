// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28", // Match your contract's pragma
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
        viaIR: true, // You have this enabled according to logs
    },
  },
  networks: {
    hardhat: {
      // CRITICAL FIX: Allows two consecutive blocks to have the same timestamp,
      // which is necessary for the zero-yield revert test to pass reliably.
      allowBlocksWithSameTimestamp: true, 
    },
    // ... other networks like sepolia, bsc, etc.
  },
};