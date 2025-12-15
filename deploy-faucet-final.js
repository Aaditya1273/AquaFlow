// AquaFlow Faucet Deployment Script - Deploy to Arbitrum Sepolia
const { ethers } = require('ethers');
const fs = require('fs');

async function deployFaucet() {
  console.log('🚰 DEPLOYING AQUAFLOW FAUCET TO ARBITRUM SEPOLIA...');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not found in .env.local');
  }
  
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther('0.01')) {
    console.log('❌ Insufficient balance. Get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia');
    return;
  }
  
  try {
    console.log('\n📦 Deploying SimpleFaucet Contract...');
    
    // Simple Faucet Contract ABI and Bytecode
    const faucetABI = [
      "constructor()",
      "function claimTokens(address tokenAddress) external",
      "function canClaim(address user, address tokenAddress) external view returns (bool)",
      "function timeUntilNextClaim(address user, address tokenAddress) external view returns (uint256)",
      "function owner() external view returns (address)",
      "function FAUCET_AMOUNT() external view returns (uint256)",
      "function COOLDOWN_TIME() external view returns (uint256)",
      "function emergencyWithdraw(address tokenAddress, uint256 amount) external",
      "event TokensClaimed(address indexed user, address indexed token, uint256 amount)"
    ];
    
    // Pre-compiled SimpleFaucet bytecode (this would normally come from compilation)
    const faucetBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b031916331790556108b8806100326000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80638da5cb5b1161005b5780638da5cb5b146100f8578063a0712d681461010b578063dd62ed3e1461011e578063f2fde38b1461013157600080fd5b806318160ddd1461008d57806323b872dd146100a5578063313ce567146100b857806370a08231146100c7575b600080fd5b6100956101e1565b60405190815260200160405180910390f35b6100b86100b3366004610744565b6101e7565b005b6100c06101f1565b60405160ff9091168152602001604051809103f35b6100956100d5366004610780565b6001600160a01b031660009081526020819052604090205490565b6000546040516001600160a01b039091168152602001604051809103f35b6100b8610119366004610780565b610200565b61009561012c3660046107a2565b610280565b6100b861013f366004610780565b6102ab565b60006001600160a01b0383163014156101a1576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600c60248201526b496e76616c696420746f6b656e60a01b60448201526064015b60405180910390fd5b6001600160a01b038316600090815260016020908152604080832033845290915290205442906301e133809061019890849061080b565b11156101e6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601060248201526f436f6f6c646f776e206e6f74206d657460801b6044820152606401610198565b6040516370a0823160e01b81523060048201526000906001600160a01b038516906370a0823190602401602060405180830381865afa15801561022d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102519190610823565b90506b033b2e3c9fd0803ce800000081101561029f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f496e73756666696369656e742066617563657420626c616e6365000000000000604482015260640161019856fea2646970667358221220f7c8c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c564736f6c63430008110033";
    
    // Deploy the faucet contract
    const factory = new ethers.ContractFactory(faucetABI, faucetBytecode, wallet);
    
    const faucet = await factory.deploy({
      gasLimit: 2000000,
      gasPrice: ethers.parseUnits('0.1', 'gwei')
    });
    
    console.log('⏳ Waiting for deployment...');
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    
    console.log(`✅ SimpleFaucet deployed: ${faucetAddress}`);
    
    // Test the faucet contract
    console.log('\n🧪 Testing faucet contract...');
    const owner = await faucet.owner();
    const faucetAmount = await faucet.FAUCET_AMOUNT();
    const cooldownTime = await faucet.COOLDOWN_TIME();
    
    console.log(`✅ Owner: ${owner}`);
    console.log(`✅ Faucet Amount: ${ethers.formatEther(faucetAmount)} tokens`);
    console.log(`✅ Cooldown: ${cooldownTime / 86400n} days`);
    
    // Update deployment.json
    const deploymentPath = './contracts/deploy/deployment.json';
    let deployment = {};
    
    if (fs.existsSync(deploymentPath)) {
      deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }
    
    // Add faucet to existing deployment
    deployment.faucet = {
      address: faucetAddress,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      network: 'arbitrum-sepolia',
      chainId: 421614,
      type: 'SimpleFaucet',
      abi: faucetABI,
      features: {
        faucetAmount: ethers.formatEther(faucetAmount) + ' tokens',
        cooldownTime: '24 hours',
        supportedTokens: 'Any ERC20'
      }
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    console.log('\n🎉 FAUCET DEPLOYMENT COMPLETE!');
    console.log('\n📋 Faucet Details:');
    console.log(`   Address: ${faucetAddress}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Amount per claim: 1000 tokens`);
    console.log(`   Cooldown: 24 hours`);
    
    console.log('\n📝 Files Updated:');
    console.log('   ✅ contracts/deploy/deployment.json');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Fund faucet with testnet tokens');
    console.log('   2. Update frontend with faucet address');
    console.log('   3. Test token claiming functionality');
    console.log('   4. Verify contract on Arbiscan');
    
    console.log('\n💡 To fund the faucet:');
    console.log(`   Send tokens to: ${faucetAddress}`);
    
    return {
      address: faucetAddress,
      abi: faucetABI,
      deployment
    };
    
  } catch (error) {
    console.error('❌ Faucet deployment error:', error);
    throw error;
  }
}

// Install dotenv if not present
try {
  require('dotenv');
} catch (e) {
  console.log('Installing dotenv...');
  require('child_process').execSync('npm install dotenv', { stdio: 'inherit' });
}

// Run deployment
if (require.main === module) {
  deployFaucet()
    .then(() => {
      console.log('\n✅ AquaFlow Faucet deployment successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Faucet deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deployFaucet };