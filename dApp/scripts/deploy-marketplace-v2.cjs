const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("🛒 Deploying Advanced NFT Marketplace (Auctions + Fees)");
  console.log("📡 Network: BSC Testnet");
  console.log("👛 Deployer:", deployer.address);
  console.log("----------------------------------------------------");

  // 1. CONFIGURATION
  // The Crikz Token Address on BSC Testnet
  const CRIKZ_TOKEN_ADDRESS = "0xaDe2E0A0cFC3415f4ec1E1F827c31861b6fdfaE9";

  if (!CRIKZ_TOKEN_ADDRESS) {
    throw new Error("❌ Crikz Token Address is missing.");
  }

  // 2. DEPLOYMENT
  console.log(`⏳ Deploying NFTMarketplace with payment token: ${CRIKZ_TOKEN_ADDRESS}...`);
  
  // FIX: Use fully qualified name to resolve HH701 error
  const NFTMarketplace = await hre.ethers.getContractFactory("contracts/NFTMarketplace.sol:NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(CRIKZ_TOKEN_ADDRESS);
  
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("----------------------------------------------------");
  console.log(`✅ NFTMarketplace deployed to: ${marketplaceAddress}`);
  console.log("----------------------------------------------------");

  // 3. VERIFICATION
  console.log("⏳ Waiting 60 seconds before verification to ensure indexer propagation...");
  await new Promise((resolve) => setTimeout(resolve, 60000));

  console.log("🔍 Starting Verification...");

  try {
    await hre.run("verify:verify", {
      address: marketplaceAddress,
      constructorArguments: [CRIKZ_TOKEN_ADDRESS],
    });
    console.log("✅ Contract Verified Successfully!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract is already verified.");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }

  console.log("\n⚠️  IMPORTANT: Update your frontend configuration with the new address below.");
  console.log(`NEW MARKETPLACE ADDRESS: ${marketplaceAddress}`);
  console.log("1. Update .env: VITE_MARKET_ADDRESS=" + marketplaceAddress);
  console.log("2. Update src/config/index.ts: NFT_MARKETPLACE_ADDRESS = \"" + marketplaceAddress + "\"");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});