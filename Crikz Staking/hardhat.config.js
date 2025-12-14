// hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// ... (other constants and requirements) ...

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = { // <--- OPENING BRACE 1 (module.exports)

  solidity: { // <--- OPENING BRACE 2 (solidity)
    version: "0.8.20",
    settings: { // <--- OPENING BRACE 3 (settings)
      optimizer: { // <--- OPENING BRACE 4 (optimizer)
        enabled: true,
        runs: 5000,
      }, // <--- CLOSING BRACE 4 (optimizer)
      viaIR: true, // <--- The line you added
    }, // <--- CLOSING BRACE 3 (settings)
  }, // <--- CLOSING BRACE 2 (solidity)

  // ... (networks, etherscan, etc.) ...

}; // <--- CLOSING BRACE 1 (module.exports)