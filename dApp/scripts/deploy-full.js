const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🚀 Deploying to ${networkName.toUpperCase()}...`);

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "BNB");

  // 1. Determine Router Address (BSC Testnet or Mainnet)
  let routerAddress;
  if (networkName === "bscTestnet") {
    routerAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // PancakeSwap V2 Testnet
  } else if (networkName === "bscMainnet") {
    routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2 Mainnet
  } else {
    routerAddress = "0x0000000000000000000000000000000000000000"; // Localhost/Mock
    console.log("⚠️  Using zero address for Router (Localhost)");
  }

  // 2. Deploy Crikz Token
  console.log("\n📦 Deploying Crikz Token...");
  const Crikz = await hre.ethers.getContractFactory("Crikz");
  // trustedForwarder set to zero address for now
  const crikz = await Crikz.deploy("0x0000000000000000000000000000000000000000", routerAddress); 
  await crikz.waitForDeployment();
  const crikzAddress = await crikz.getAddress();
  console.log(`✅ Crikz Token deployed: ${crikzAddress}`);

  // 3. Deploy Crikz NFT
  console.log("\n🎨 Deploying Crikz NFT...");
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`✅ Crikz NFT deployed:   ${nftAddress}`);

  // 4. Initial Funding (Optional - for testing)
  if (networkName === "bscTestnet" || networkName === "localhost") {
    console.log("\n⚙️  Funding Production Pool...");
    const fundAmount = hre.ethers.parseEther("100000"); // 100k Tokens
    const tx = await crikz.fundProductionPool(fundAmount);
    await tx.wait();
    console.log("   Pool Funded with 100,000 CRIKZ");
  }

  // 5. Generate Output for Frontend
  console.log("\n💾 Saving configuration...");
  const envContent = `
# BSC Testnet Configuration
VITE_CRIKZ_TOKEN_ADDRESS=${crikzAddress}
VITE_PANCAKESWAP_ROUTER=${routerAddress}
# NFT Contract
VITE_NFT_ADDRESS=${nftAddress}
# Network
VITE_EXPECTED_CHAIN_ID=97
`;

  // Append/Write to .env.local for local dev
  const envPath = path.join(__dirname, "..", ".env.local");
  fs.appendFileSync(envPath, envContent);
  console.log(`   Updated .env.local`);

  // 6. Verification Instructions
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\nTo verify contracts on BscScan:");
  console.log(`npx hardhat verify --network ${networkName} ${crikzAddress} "0x0000000000000000000000000000000000000000" "${routerAddress}"`);
  console.log(`npx hardhat verify --network ${networkName} ${nftAddress}`);
  console.log("\n👉 Don't forget to update 'src/config.ts' with these new addresses!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});