const { ethers } = require('ethers');
const fs = require('fs');
const solc = require('solc');
require('dotenv').config();

async function compileFaucet() {
  console.log('📦 Compiling SimpleFaucet contract...');
  
  const source = fs.readFileSync('./contracts/solidity/SimpleFaucet.sol', 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: {
      'SimpleFaucet.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error('Compilation error:', error.formattedMessage);
        throw new Error('Compilation failed');
      } else {
        console.warn('Compilation warning:', error.formattedMessage);
      }
    });
  }
  
  const contract = output.contracts['SimpleFaucet.sol']['SimpleFaucet'];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
  };
}

async function deployFaucet() {
  console.log('🚰 Deploying SimpleFaucet Contract...\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('Deploying with account:', wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH\n');

  try {
    // Compile contract
    const { abi, bytecode } = await compileFaucet();
    
    // Deploy the contract
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    console.log('📦 Deploying SimpleFaucet...');
    
    const faucet = await factory.deploy({
      gasLimit: 2000000,
      gasPrice: ethers.parseUnits('0.1', 'gwei')
    });
    
    console.log('⏳ Waiting for deployment...');
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    
    console.log('✅ SimpleFaucet deployed to:', faucetAddress);

    // Update deployment.json
    const deploymentPath = './contracts/deploy/deployment.json';
    let deployment = {};
    
    if (fs.existsSync(deploymentPath)) {
      deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }
    
    deployment.faucet = {
      address: faucetAddress,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      network: 'arbitrum-sepolia',
      chainId: 421614,
      type: 'SimpleFaucet',
      abi: abi
    };
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    
    console.log('\n🎉 Faucet Deployment Complete!');
    console.log(`📄 Deployment info saved to ${deploymentPath}`);
    console.log(`🔗 Faucet Address: ${faucetAddress}`);
    console.log(`⏰ Cooldown: 24 hours`);
    console.log(`💰 Amount per claim: 1000 tokens`);
    
    return faucetAddress;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

if (require.main === module) {
  deployFaucet()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployFaucet };