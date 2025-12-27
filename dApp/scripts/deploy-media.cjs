const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("🎥 Starting CrikzMedia Deployment");
  console.log("📡 Network: BSC Testnet");
  console.log("👛 Deployer:", deployer.address);
  console.log("----------------------------------------------------");

  // 1. Get Factory
  const CrikzMedia = await hre.ethers.getContractFactory("CrikzMedia");

  // 2. Deploy
  console.log("⏳ Deploying contract... please wait.");
  const media = await CrikzMedia.deploy();
  await media.waitForDeployment();

  const address = await media.getAddress();

  console.log("----------------------------------------------------");
  console.log("✅ DEPLOYMENT SUCCESS");
  console.log("----------------------------------------------------");
  console.log(`CrikzMedia Address: ${address}`);
  console.log("----------------------------------------------------");
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("1. Copy the address above.");
  console.log("2. Open src/config/index.ts");
  console.log("3. Replace CRIKZ_MEDIA_ADDRESS with this new address.");
  console.log("\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});