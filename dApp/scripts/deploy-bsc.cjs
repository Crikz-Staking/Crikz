const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying with:", deployer.address);

  // Deploy Token
  const Crikz = await hre.ethers.getContractFactory("Crikz");
  const crikz = await Crikz.deploy("0x0000000000000000000000000000000000000000", "0xD99D1c33F9fC3444f8101754aBC46c52416550D1");
  await crikz.waitForDeployment();
  console.log("Crikz Token:", await crikz.getAddress());

  // Deploy NFT
  const CrikzNFT = await hre.ethers.getContractFactory("CrikzNFT");
  const nft = await CrikzNFT.deploy();
  await nft.waitForDeployment();
  console.log("Crikz NFT:", await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});