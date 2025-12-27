const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying with:", deployer.address);

  const CRIKZ_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  console.log("✅ CrikzNFT deployed to:", await nft.getAddress());

  const Market = await hre.ethers.getContractFactory("NFTMarketplace");
  const market = await Market.deploy(CRIKZ_TOKEN_ADDRESS);
  await market.waitForDeployment();
  console.log("✅ Marketplace deployed to:", await market.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});