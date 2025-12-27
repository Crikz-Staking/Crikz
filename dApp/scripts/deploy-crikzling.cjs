const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of CrikzlingMemory...");

  // 1. Get the deployer wallet
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} BNB`);

  // 2. Deploy the Contract
  // Note: No arguments needed for the updated constructor
  const CrikzlingMemory = await hre.ethers.getContractFactory("CrikzlingMemory");
  const memoryContract = await CrikzlingMemory.deploy();

  console.log("Transaction sent. Waiting for deployment...");
  
  await memoryContract.waitForDeployment();
  const contractAddress = await memoryContract.getAddress();

  console.log("---------------------------------------------");
  console.log(`✅ CrikzlingMemory deployed to: ${contractAddress}`);
  console.log("---------------------------------------------");

  // 3. Wait for Block Confirmations
  // Essential for verification! Block explorers need time to index the bytecode.
  console.log("Waiting 30 seconds for block propagation before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // 4. Verify on BscScan
  try {
    console.log("Attempting to verify contract...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // No arguments for this contract
    });
    console.log("✅ Contract successfully verified on BscScan!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});