// scripts/deploy.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Crikz Protocol Deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ==================== DEPLOYMENT PARAMETERS ====================
  
  // Trusted Forwarder for ERC2771 (gasless transactions)
  // Use zero address if not implementing gasless transactions
  const trustedForwarder = "0x0000000000000000000000000000000000000000";
  
  // PancakeSwap Router Address
  let pancakeRouter;
  const network = hre.network.name;
  
  if (network === "localhost" || network === "hardhat") {
    // For localhost, we'll deploy a mock router or use zero address
    console.log("⚠️  Localhost detected - Using zero address for PancakeSwap Router");
    console.log("    (In production, this would be the actual router address)\n");
    pancakeRouter = "0x0000000000000000000000000000000000000001"; // Mock address
  } else if (network === "bscTestnet") {
    pancakeRouter = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet Router
  } else if (network === "bscMainnet") {
    pancakeRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // BSC Mainnet Router
  } else {
    throw new Error(`Unknown network: ${network}`);
  }

  console.log("📋 Deployment Parameters:");
  console.log("   Network:", network);
  console.log("   Trusted Forwarder:", trustedForwarder);
  console.log("   PancakeSwap Router:", pancakeRouter);
  console.log("");

  // ==================== DEPLOY CRIKZ TOKEN ====================
  
  console.log("📦 Deploying Crikz Token...");
  const Crikz = await hre.ethers.getContractFactory("Crikz");
  const crikz = await Crikz.deploy(trustedForwarder, pancakeRouter);
  await crikz.waitForDeployment();
  
  const crikzAddress = await crikz.getAddress();
  console.log("✅ Crikz Token deployed to:", crikzAddress);
  console.log("");

  // ==================== VERIFY DEPLOYMENT ====================
  
  console.log("🔍 Verifying deployment...");
  const totalSupply = await crikz.totalSupply();
  const deployerBalance = await crikz.balanceOf(deployer.address);
  const contractBalance = await crikz.balanceOf(crikzAddress);
  
  console.log("   Total Supply:", hre.ethers.formatEther(totalSupply), "CRIKZ");
  console.log("   Deployer Balance:", hre.ethers.formatEther(deployerBalance), "CRIKZ");
  console.log("   Contract Balance:", hre.ethers.formatEther(contractBalance), "CRIKZ");
  console.log("");

  // ==================== VERIFY ORDER TYPES ====================
  
  console.log("📊 Verifying Order Types...");
  for (let i = 0; i < 7; i++) {
    const orderType = await crikz.orderTypes(i);
    const days = Number(orderType.lockDuration) / (24 * 60 * 60);
    const multiplier = Number(orderType.reputationMultiplier) / 1e18;
    console.log(`   Tier ${i}: ${orderType.name}`);
    console.log(`      Lock: ${days} days | Multiplier: ${multiplier.toFixed(3)}x`);
  }
  console.log("");

  // ==================== INITIAL SETUP ====================
  
  console.log("⚙️  Initial Setup...");
  
  // Fund the production pool with initial tokens
  const fundAmount = hre.ethers.parseEther("100000"); // 100k tokens
  console.log("   Funding production pool with:", hre.ethers.formatEther(fundAmount), "CRIKZ");
  
  const fundTx = await crikz.fundProductionPool(fundAmount);
  await fundTx.wait();
  console.log("   ✅ Production pool funded");
  
  // Check production fund state
  const productionFund = await crikz.productionFund();
  console.log("   Production Fund Balance:", hre.ethers.formatEther(productionFund.balance), "CRIKZ");
  console.log("   Total Reputation:", hre.ethers.formatEther(productionFund.totalReputation));
  console.log("");

  // ==================== TEST TRANSACTION (Localhost only) ====================
  
  if (network === "localhost" || network === "hardhat") {
    console.log("🧪 Running Test Transaction (Localhost)...");
    
    // Create a test order
    const testAmount = hre.ethers.parseEther("1000"); // 1000 tokens
    const testTier = 2; // Standard Run (34 days)
    
    console.log("   Creating test order:");
    console.log("      Amount:", hre.ethers.formatEther(testAmount), "CRIKZ");
    console.log("      Tier:", testTier, "(Standard Run - 34 days)");
    
    const createOrderTx = await crikz.createOrder(testAmount, testTier);
    await createOrderTx.wait();
    console.log("   ✅ Test order created");
    
    // Check active orders
    const activeOrders = await crikz.getActiveOrders(deployer.address);
    console.log("   Active Orders:", activeOrders.length);
    
    if (activeOrders.length > 0) {
      const order = activeOrders[0];
      console.log("      Amount:", hre.ethers.formatEther(order.amount), "CRIKZ");
      console.log("      Reputation:", hre.ethers.formatEther(order.reputation));
      console.log("      Order Type:", Number(order.orderType));
    }
    console.log("");
  }

  // ==================== SAVE DEPLOYMENT INFO ====================
  
  console.log("💾 Saving deployment info...");
  
  const deploymentInfo = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      Crikz: crikzAddress,
      PancakeRouter: pancakeRouter,
      TrustedForwarder: trustedForwarder,
    },
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  
  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("   ✅ Deployment info saved to:", deploymentFile);
  console.log("");

  // ==================== GENERATE .ENV.LOCAL ====================
  
  console.log("📝 Generating .env.local...");
  
  const envContent = `# Auto-generated by deploy script - ${new Date().toISOString()}
# Crikz Protocol - ${network.toUpperCase()}

# Contract Addresses
VITE_CRIKZ_TOKEN_ADDRESS=${crikzAddress}
VITE_PANCAKESWAP_ROUTER=${pancakeRouter}
VITE_TRUSTED_FORWARDER=${trustedForwarder}

# Network Configuration
VITE_EXPECTED_CHAIN_ID=${network === "localhost" || network === "hardhat" ? "31337" : network === "bscTestnet" ? "97" : "56"}
VITE_CHAIN_NAME=${network === "localhost" || network === "hardhat" ? "Localhost" : network === "bscTestnet" ? "BSC Testnet" : "BSC Mainnet"}

# WalletConnect (Update with your project ID)
VITE_WALLETCONNECT_PROJECT_ID=cdf8dadd25a1999d03bcb554e82147f8

# RPC URL (for localhost)
${network === "localhost" || network === "hardhat" ? "VITE_RPC_URL=http://127.0.0.1:8545" : ""}
`;

  const envLocalPath = path.join(__dirname, "..", ".env.local");
  fs.writeFileSync(envLocalPath, envContent);
  console.log("   ✅ .env.local generated");
  console.log("");

  // ==================== SUMMARY ====================
  
  console.log("═══════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("📋 Contract Addresses:");
  console.log("   Crikz Token:", crikzAddress);
  console.log("   Network:", network);
  console.log("");
  console.log("🔧 Next Steps:");
  console.log("");
  
  if (network === "localhost" || network === "hardhat") {
    console.log("   1. Keep Hardhat node running in terminal:");
    console.log("      npx hardhat node");
    console.log("");
    console.log("   2. Start the frontend:");
    console.log("      npm run dev");
    console.log("");
    console.log("   3. Connect MetaMask to localhost:");
    console.log("      Network Name: Localhost 8545");
    console.log("      RPC URL: http://127.0.0.1:8545");
    console.log("      Chain ID: 31337");
    console.log("      Currency: ETH");
    console.log("");
    console.log("   4. Import test account to MetaMask:");
    console.log("      Use one of the private keys shown when you started 'npx hardhat node'");
    console.log("");
  } else {
    console.log("   1. Verify contract on BSCScan (if on testnet/mainnet):");
    console.log(`      npx hardhat verify --network ${network} ${crikzAddress} "${trustedForwarder}" "${pancakeRouter}"`);
    console.log("");
    console.log("   2. Start the frontend:");
    console.log("      npm run dev");
    console.log("");
    console.log("   3. Update .env.local with your WalletConnect Project ID");
    console.log("");
  }
  
  console.log("═══════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });