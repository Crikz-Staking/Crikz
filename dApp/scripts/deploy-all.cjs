// scripts/deploy-all.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying with:", deployer.address);

  // 1. Deploy/Attach CRIKZ Token
  // If you already have the token deployed, paste address here. If not, uncomment deployment.
  const CRIKZ_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // <--- UPDATE THIS IF NEEDED
  // const Crikz = await hre.ethers.getContractFactory("Crikz");
  // const crikz = await Crikz.deploy(...);
  // await crikz.waitForDeployment();
  
  // 2. Deploy NFT
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  console.log("✅ CrikzNFT deployed to:", await nft.getAddress());

  // 3. Deploy Marketplace (Pass CRIKZ token address)
  const Market = await hre.ethers.getContractFactory("NFTMarketplace");
  const market = await Market.deploy(CRIKZ_TOKEN_ADDRESS);
  await market.waitForDeployment();
  console.log("✅ Marketplace deployed to:", await market.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});