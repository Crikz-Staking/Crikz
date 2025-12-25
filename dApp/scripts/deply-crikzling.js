const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🧬 Starting Crikzling Soul Genesis...");
  console.log("Deploying with account:", deployer.address);

  // We fetch the contract factory
  const CrikzlingMemory = await hre.ethers.getContractFactory("CrikzlingMemory");
  
  // Deploying with a manual gas limit check to prevent 'out of gas' errors
  const crikzling = await CrikzlingMemory.deploy({
    gasLimit: 3000000 
  });

  await crikzling.waitForDeployment();
  const address = await crikzling.getAddress();

  console.log("--------------------------------------------------");
  console.log("✅ Crikzling Permanent Memory Deployed!");
  console.log("Address:", address);
  console.log("--------------------------------------------------");
  console.log("👉 ACTION: Copy the address above and paste it into");
  console.log("   src/hooks/useCrikzling.ts -> CRIKZLING_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});