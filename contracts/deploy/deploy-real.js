// Real AquaFlow Deployment Script - Deploy to Arbitrum Sepolia
// This makes the smart contracts actually work on blockchain

const { ethers } = require('hardhat');
const fs = require('fs');

async function deployReal() {
  console.log('🚀 DEPLOYING REAL AQUAFLOW TO ARBITRUM SEPOLIA...');
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await deployer.getBalance())} ETH`);
  
  // 1. Deploy Solidity Wrapper (real contract)
  console.log('\n📦 Deploying Solidity Wrapper...');
  const AquaFlowWrapper = await ethers.getContractFactory('AquaFlowWrapper');
  
  // For hackathon: use mock Stylus address, replace with real after Stylus deployment
  const mockStylelusAddress = '0x1111111111111111111111111111111111111111';
  
  const wrapper = await AquaFlowWrapper.deploy(mockStylelusAddress);
  await wrapper.deployed();
  
  console.log(`✅ AquaFlowWrapper deployed: ${wrapper.address}`);
  
  // 2. Deploy mock ERC20 tokens for testing
  console.log('\n🪙 Deploying test tokens...');
  const MockERC20 = await ethers.getContractFactory('MockERC20');
  
  const usdc = await MockERC20.deploy('USD Coin', 'USDC', 6);
  await usdc.deployed();
  console.log(`✅ Mock USDC: ${usdc.address}`);
  
  const usdt = await MockERC20.deploy('Tether USD', 'USDT', 6);
  await usdt.deployed();
  console.log(`✅ Mock USDT: ${usdt.address}`);
  
  // 3. Mint test tokens to deployer
  console.log('\n💰 Minting test tokens...');
  await usdc.mint(deployer.address, ethers.parseUnits('1000000', 6));
  await usdt.mint(deployer.address, ethers.parseUnits('1000000', 6));
  console.log('✅ Test tokens minted');
  
  // 4. Test the wrapper contract
  console.log('\n🧪 Testing wrapper contract...');
  const quote = await wrapper.getQuote(
    usdc.address,
    usdt.address,
    ethers.parseUnits('100', 6)
  );
  console.log(`✅ Quote test: ${ethers.formatUnits(quote, 6)} USDT for 100 USDC`);
  
  // 5. Save deployment addresses
  const deployment = {
    network: 'arbitrum-sepolia',
    chainId: 421614,
    contracts: {
      AquaFlowWrapper: wrapper.address,
      MockUSDC: usdc.address,
      MockUSDT: usdt.address,
      StylelusRouter: mockStylelusAddress, // Will be updated when Stylus is deployed
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    'contracts/deploy/deployment.json',
    JSON.stringify(deployment, null, 2)
  );
  
  console.log('\n🎉 REAL DEPLOYMENT COMPLETE!');
  console.log('\n📋 Contract Addresses:');
  console.log(`   AquaFlowWrapper: ${wrapper.address}`);
  console.log(`   Mock USDC: ${usdc.address}`);
  console.log(`   Mock USDT: ${usdt.address}`);
  console.log('\n📝 Next Steps:');
  console.log('   1. Deploy Stylus router with: cargo stylus deploy');
  console.log('   2. Update frontend with real addresses');
  console.log('   3. Test with real transactions');
  
  return deployment;
}

// Stylus deployment helper
async function deployStylelusRouter() {
  console.log('\n🦀 DEPLOYING STYLUS ROUTER...');
  console.log('Run these commands:');
  console.log('');
  console.log('cd contracts/stylus');
  console.log('cargo stylus check');
  console.log('cargo stylus deploy --private-key YOUR_PRIVATE_KEY');
  console.log('');
  console.log('This will deploy the Rust contract to Arbitrum Sepolia');
}

if (require.main === module) {
  deployReal()
    .then(() => {
      deployStylelusRouter();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployReal };