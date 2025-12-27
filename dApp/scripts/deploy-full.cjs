const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Starting Full Deployment with account:", deployer.address);
  console.log("----------------------------------------------------");

  // 1. CONSTANTS FOR BSC TESTNET
  // PancakeSwap V2 Router (BSC Testnet)
  const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; 
  // Trusted Forwarder (Using a zero address or a known forwarder if you implement MetaTx)
  const FORWARDER_ADDRESS = "0x0000000000000000000000000000000000000000"; 

  // 2. DEPLOY CRIKZ TOKEN
  console.log("🧬 Deploying Crikz Token...");
  const Crikz = await hre.ethers.getContractFactory("Crikz");
  const crikz = await Crikz.deploy(FORWARDER_ADDRESS, ROUTER_ADDRESS);
  await crikz.waitForDeployment();
  const crikzAddress = await crikz.getAddress();
  console.log(`✅ Crikz Token deployed to: ${crikzAddress}`);

  // 3. DEPLOY CRIKZ NFT
  console.log("🎨 Deploying CrikzNFT...");
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`✅ CrikzNFT deployed to: ${nftAddress}`);

  // 4. DEPLOY MARKETPLACE (Requires Token Address)
  console.log("🏪 Deploying Marketplace...");
  const Market = await hre.ethers.getContractFactory("NFTMarketplace");
  const market = await Market.deploy(crikzAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`✅ Marketplace deployed to: ${marketAddress}`);

  // 5. DEPLOY CRIKZLING MEMORY (AI)
  console.log("🧠 Deploying Crikzling Memory...");
  const Memory = await hre.ethers.getContractFactory("CrikzlingMemory");
  const memory = await Memory.deploy();
  await memory.waitForDeployment();
  const memoryAddress = await memory.getAddress();
  console.log(`✅ CrikzlingMemory deployed to: ${memoryAddress}`);

  console.log("----------------------------------------------------");
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
  console.log("Update your src/config/index.ts with these values:");
  console.log(`export const CRIKZ_TOKEN_ADDRESS = "${crikzAddress}";`);
  console.log(`export const CRIKZ_NFT_ADDRESS = "${nftAddress}";`);
  console.log(`export const NFT_MARKETPLACE_ADDRESS = "${marketAddress}";`);
  console.log(`export const CRIKZLING_MEMORY_ADDRESS = "${memoryAddress}";`);
  
  // Optional: Verify on Etherscan
  console.log("\n(Wait 1 min before verifying on BscScan)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});