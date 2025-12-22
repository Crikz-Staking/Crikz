const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("🚀 Deploying Crikz Protocol to BSC Testnet");
  console.log("📝 Deployer Account:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("----------------------------------------------------\n");

  // --- Configuration ---
  const trustedForwarder = "0x0000000000000000000000000000000000000000"; // Optional
  const pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet Router [cite: 7, 485]

  // 1. Deploy Crikz Token (ERC20)
  console.log("📦 1/2: Deploying Crikz Token...");
  const Crikz = await hre.ethers.getContractFactory("Crikz");
  const crikz = await Crikz.deploy(trustedForwarder, pancakeRouter);
  await crikz.waitForDeployment();
  const crikzAddress = await crikz.getAddress();
  console.log("✅ Crikz Token: ", crikzAddress);

  // 2. Deploy Crikz NFT
  console.log("\n📦 2/2: Deploying Crikz NFT...");
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ Crikz NFT:   ", nftAddress);

  // 3. Initial Setup: Fund the Production Pool
  console.log("\n⚙️  Initial Setup...");
  const fundAmount = hre.ethers.parseEther("100000"); // 100k tokens [cite: 499, 500]
  console.log(`   Funding production pool with ${hre.ethers.formatEther(fundAmount)} CRIKZ...`);
  const fundTx = await crikz.fundProductionPool(fundAmount);
  await fundTx.wait();
  console.log("   ✅ Pool funded successfully.");

  console.log("\n----------------------------------------------------");
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("----------------------------------------------------");
  console.log(`VITE_CRIKZ_TOKEN_ADDRESS=${crikzAddress}`);
  console.log(`VITE_NFT_ADDRESS=${nftAddress}`);
  console.log("----------------------------------------------------");
  
  console.log("\n🔍 Verification Commands:");
  console.log(`npx hardhat verify --network bscTestnet ${crikzAddress} "${trustedForwarder}" "${pancakeRouter}"`);
  console.log(`npx hardhat verify --network bscTestnet ${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });