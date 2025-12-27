import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`\n🚀 Starting deployment to ${networkName.toUpperCase()}...`);
  console.log(`📝 Account: ${deployer.address}\n`);

  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  const address = await nft.getAddress();

  console.log("==================================================");
  console.log(`✅ DEPLOYED ADDRESS: ${address}`);
  console.log("==================================================");

  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n⏳ Waiting for block confirmations to ensure BscScan is ready...");
    await nft.deploymentTransaction().wait(5);
    console.log("🔍 Verifying contract on BscScan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [], 
      });
      console.log("✨ Contract successfully verified!");
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️  Contract is already verified.");
      } else {
        console.error("❌ Verification failed:", error.message);
      }
    }
  } else {
    console.log("\nℹ️  Skipping verification on local network.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});