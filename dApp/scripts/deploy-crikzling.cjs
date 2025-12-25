const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🧬 Starting Crikzling Soul Genesis...");
  console.log("Deploying to:", hre.network.name);
  console.log("Deploying with account:", deployer.address);

  const CrikzlingMemory = await hre.ethers.getContractFactory("CrikzlingMemory");
  
  // Fixed the variable name from 'cling' to 'crikzling'
  const crikzling = await CrikzlingMemory.deploy();

  console.log("⏳ Waiting for deployment transaction...");
  await crikzling.waitForDeployment();
  
  const address = await crikzling.getAddress();

  console.log("--------------------------------------------------");
  console.log("✅ Crikzling Permanent Memory Deployed!");
  console.log("Address:", address);
  console.log("--------------------------------------------------");
  console.log("Action: Update CRIKZLING_CONTRACT_ADDRESS in src/hooks/useCrikzling.ts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});