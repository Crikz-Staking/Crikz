// scripts/deploy-marketplace-v2.cjs
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Marketplace V2 with account:", deployer.address);

  const CRIKZ_TOKEN = "0xaDe2E0A0cFC3415f4ec1E1F827c31861b6fdfaE9"; // Your Token

  const Market = await hre.ethers.getContractFactory("contracts/NFTMarketplace.sol:NFTMarketplace");
  const market = await Market.deploy(CRIKZ_TOKEN);
  await market.waitForDeployment();

  console.log("✅ Marketplace V2 Deployed to:", await market.getAddress());
  console.log("⚠️  Update VITE_MARKET_ADDRESS in .env and src/config/index.ts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});