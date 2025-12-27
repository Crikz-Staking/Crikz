const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("🏆 Deploying SportsBetting Contract");
  console.log("📡 Network: BSC Testnet");
  console.log("👛 Deployer:", deployer.address);
  console.log("----------------------------------------------------");

  // 1. CONFIGURATION
  // This is the Crikz Token address from your config/project export
  // If you redeployed the token, update this address!
  const BETTING_TOKEN_ADDRESS = "0xaDe2E0A0cFC3415f4ec1E1F827c31861b6fdfaE9";

  if (!BETTING_TOKEN_ADDRESS) {
    throw new Error("❌ Betting Token Address is missing.");
  }

  // 2. DEPLOYMENT
  console.log(`⏳ Deploying SportsBetting with token: ${BETTING_TOKEN_ADDRESS}...`);
  
  const SportsBetting = await hre.ethers.getContractFactory("SportsBetting");
  const betting = await SportsBetting.deploy(BETTING_TOKEN_ADDRESS);
  
  await betting.waitForDeployment();
  const bettingAddress = await betting.getAddress();

  console.log(`✅ SportsBetting deployed to: ${bettingAddress}`);
  console.log("----------------------------------------------------");

  // 3. VERIFICATION
  // We must wait a bit for Etherscan/BscScan to index the bytecode
  console.log("⏳ Waiting 60 seconds before verification to ensure indexer propagation...");
  await new Promise((resolve) => setTimeout(resolve, 60000));

  console.log("🔍 Starting Verification...");

  try {
    await hre.run("verify:verify", {
      address: bettingAddress,
      constructorArguments: [BETTING_TOKEN_ADDRESS],
    });
    console.log("✅ Contract Verified Successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified.");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }

  console.log("----------------------------------------------------");
  console.log("📝 NEXT STEPS:");
  console.log("1. Add the following to your .env file:");
  console.log(`   VITE_SPORTS_BETTING_ADDRESS=${bettingAddress}`);
  console.log("2. Update your betting frontend hooks to use this address.");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});