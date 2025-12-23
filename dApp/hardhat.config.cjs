require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // 1. Set BSC Testnet as the default network for all operations
  defaultNetwork: "bscTestnet", 

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { 
        enabled: true, 
        runs: 200 
      },
      evmVersion: "cancun",
      viaIR: true, // Keep this for your complex structs
    },
  },
  networks: {
    hardhat: {
      // Useful for testing forks if needed later
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // 2. Define BSC Testnet Configuration
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 10000000000, // 10 Gwei (helps prevent "transaction underpriced" errors)
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
    // Custom chain config is often required for BSC verification to work reliably
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com"
        }
      }
    ]
  }
};