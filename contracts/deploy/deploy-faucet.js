const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log('🚰 Deploying AquaFlow Faucet Contract...\n');

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH\n');

  // Deploy AquaFlowFaucet
  console.log('📦 Deploying AquaFlowFaucet...');
  const AquaFlowFaucet = await ethers.getContractFactory('AquaFlowFaucet');
  const faucet = await AquaFlowFaucet.deploy();
  await faucet.deployed();
  
  console.log('✅ AquaFlowFaucet deployed to:', faucet.address);

  // Token addresses from our existing deployment
  const tokens = {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    UNI: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
    WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  };

  // Add tokens to faucet with appropriate amounts
  console.log('\n🔧 Configuring faucet tokens...');
  
  const tokenConfigs = {
    USDC: ethers.utils.parseUnits('1000', 6),    // 1000 USDC (6 decimals)
    USDT: ethers.utils.parseUnits('1000', 6),    // 1000 USDT (6 decimals)
    ARB: ethers.utils.parseUnits('500', 18),     // 500 ARB (18 decimals)
    UNI: ethers.utils.parseUnits('100', 18),     // 100 UNI (18 decimals)
    LINK: ethers.utils.parseUnits('50', 18),     // 50 LINK (18 decimals)
    WBTC: ethers.utils.parseUnits('0.1', 8),     // 0.1 WBTC (8 decimals)
    DAI: ethers.utils.parseUnits('1000', 18)     // 1000 DAI (18 decimals)
  };

  for (const [symbol, address] of Object.entries(tokens)) {
    try {
      const amount = tokenConfigs[symbol];
      console.log(`Adding ${symbol} (${address}) with amount ${ethers.utils.formatUnits(amount, symbol === 'USDC' || symbol === 'USDT' ? 6 : symbol === 'WBTC' ? 8 : 18)}`);
      
      const tx = await faucet.addToken(address, amount);
      await tx.wait();
      
      console.log(`✅ ${symbol} added to faucet`);
    } catch (error) {
      console.log(`❌ Failed to add ${symbol}:`, error.message);
    }
  }

  // Create deployment info
  const deploymentInfo = {
    network: 'arbitrum-sepolia',
    chainId: 421614,
    faucet: {
      address: faucet.address,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      gasUsed: 'TBD',
      supportedTokens: Object.keys(tokens).length
    },
    tokens: tokens,
    tokenConfigs: Object.fromEntries(
      Object.entries(tokenConfigs).map(([symbol, amount]) => [
        symbol, 
        ethers.utils.formatUnits(amount, symbol === 'USDC' || symbol === 'USDT' ? 6 : symbol === 'WBTC' ? 8 : 18)
      ])
    )
  };

  // Save deployment info
  
  // Update existing deployment.json
  const deploymentPath = path.join(__dirname, 'deployment.json');
  let existingDeployment = {};
  
  if (fs.existsSync(deploymentPath)) {
    existingDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  
  existingDeployment.faucet = deploymentInfo.faucet;
  existingDeployment.faucetTokens = deploymentInfo.tokens;
  existingDeployment.faucetAmounts = deploymentInfo.tokenConfigs;
  
  fs.writeFileSync(deploymentPath, JSON.stringify(existingDeployment, null, 2));

  console.log('\n🎉 Faucet Deployment Complete!');
  console.log('📄 Deployment info saved to deployment.json');
  console.log('\n📋 Summary:');
  console.log(`Faucet Address: ${faucet.address}`);
  console.log(`Supported Tokens: ${Object.keys(tokens).length}`);
  console.log(`Cooldown Period: 24 hours`);
  console.log(`Network: Arbitrum Sepolia (${421614})`);
  
  console.log('\n🔗 Next Steps:');
  console.log('1. Fund the faucet with tokens');
  console.log('2. Update frontend with faucet address');
  console.log('3. Test faucet functionality');
  console.log('4. Verify contract on Arbiscan');

  // Verification command
  console.log('\n📝 Verify contract with:');
  console.log(`npx hardhat verify --network arbitrum-sepolia ${faucet.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });