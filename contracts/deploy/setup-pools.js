// Setup Pool Registry with Demo Pools
// Creates realistic pool data for hackathon demonstration

const { ethers } = require('hardhat');
const fs = require('fs');

async function setupPools() {
  console.log('🏊 Setting up AquaFlow Pool Registry...');
  
  // Load deployment addresses
  const deployment = JSON.parse(
    fs.readFileSync('contracts/deploy/deployment.json', 'utf8')
  );
  
  const [deployer] = await ethers.getSigners();
  
  // Get contract instances
  const wrapper = await ethers.getContractAt('AquaFlowWrapper', deployment.contracts.AquaFlowWrapper);
  const usdc = await ethers.getContractAt('MockERC20', deployment.contracts.MockUSDC);
  const usdt = await ethers.getContractAt('MockERC20', deployment.contracts.MockUSDT);
  
  console.log('📊 Creating demo pools...');
  
  // Demo pool data (simulated but realistic)
  const demoPools = [
    {
      name: 'USDC/USDT Stable Pool',
      tokenA: deployment.contracts.MockUSDC,
      tokenB: deployment.contracts.MockUSDT,
      reserveA: ethers.parseUnits('1000000', 6), // 1M USDC
      reserveB: ethers.parseUnits('1000000', 6), // 1M USDT
      fee: 30, // 0.3%
      poolType: 0, // Uniswap V2 style
      tvl: 2000000, // $2M TVL
      volume24h: 500000, // $500K daily volume
    },
    {
      name: 'ETH/USDC Major Pool',
      tokenA: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
      tokenB: deployment.contracts.MockUSDC,
      reserveA: ethers.parseUnits('500', 18), // 500 ETH
      reserveB: ethers.parseUnits('1000000', 6), // 1M USDC
      fee: 30, // 0.3%
      poolType: 0,
      tvl: 2000000, // $2M TVL
      volume24h: 1000000, // $1M daily volume
    },
    {
      name: 'ARB/ETH Pool',
      tokenA: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB token
      tokenB: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
      reserveA: ethers.parseUnits('1000000', 18), // 1M ARB
      reserveB: ethers.parseUnits('500', 18), // 500 ETH
      fee: 30, // 0.3%
      poolType: 0,
      tvl: 1000000, // $1M TVL
      volume24h: 200000, // $200K daily volume
    },
    {
      name: 'USDC/USDT Nova Pool',
      tokenA: deployment.contracts.MockUSDC,
      tokenB: deployment.contracts.MockUSDT,
      reserveA: ethers.parseUnits('500000', 6), // 500K USDC
      reserveB: ethers.parseUnits('500000', 6), // 500K USDT
      fee: 25, // 0.25% (lower fee on Nova)
      poolType: 0,
      tvl: 1000000, // $1M TVL
      volume24h: 300000, // $300K daily volume
      chainId: 42170, // Arbitrum Nova
    },
  ];
  
  // Create pool registry data structure
  const poolRegistry = {
    pools: {},
    pairMappings: {},
    chainPools: {
      42161: [], // Arbitrum One
      42170: [], // Arbitrum Nova
      421337: [], // Demo Orbit L3
    },
    stats: {
      totalPools: demoPools.length,
      totalTVL: demoPools.reduce((sum, pool) => sum + pool.tvl, 0),
      totalVolume24h: demoPools.reduce((sum, pool) => sum + pool.volume24h, 0),
    }
  };
  
  // Process each demo pool
  demoPools.forEach((pool, index) => {
    const poolId = index + 1;
    const chainId = pool.chainId || 42161; // Default to Arbitrum One
    
    // Create pool info
    poolRegistry.pools[poolId] = {
      id: poolId,
      address: `0x${(poolId * 1111111111111111111111111111111111111111).toString(16).padStart(40, '0')}`,
      tokenA: pool.tokenA,
      tokenB: pool.tokenB,
      reserveA: pool.reserveA.toString(),
      reserveB: pool.reserveB.toString(),
      fee: pool.fee,
      poolType: pool.poolType,
      chainId: chainId,
      isActive: true,
      lastUpdated: Math.floor(Date.now() / 1000),
      name: pool.name,
      stats: {
        tvlUSD: pool.tvl,
        volume24hUSD: pool.volume24h,
        fees24hUSD: Math.floor(pool.volume24h * pool.fee / 10000),
        priceImpact1k: Math.floor(1000 / Math.sqrt(pool.tvl / 1000)), // Simplified impact
        utilizationRate: 20 + Math.floor(Math.random() * 60), // 20-80%
      }
    };
    
    // Add to chain mapping
    poolRegistry.chainPools[chainId].push(poolId);
    
    // Add to pair mapping
    const pairKey = `${pool.tokenA.toLowerCase()}-${pool.tokenB.toLowerCase()}`;
    const reversePairKey = `${pool.tokenB.toLowerCase()}-${pool.tokenA.toLowerCase()}`;
    
    if (!poolRegistry.pairMappings[pairKey]) {
      poolRegistry.pairMappings[pairKey] = [];
    }
    if (!poolRegistry.pairMappings[reversePairKey]) {
      poolRegistry.pairMappings[reversePairKey] = [];
    }
    
    poolRegistry.pairMappings[pairKey].push(poolId);
    poolRegistry.pairMappings[reversePairKey].push(poolId);
    
    console.log(`✅ ${pool.name} (Pool ID: ${poolId})`);
    console.log(`   TVL: $${pool.tvl.toLocaleString()}`);
    console.log(`   24h Volume: $${pool.volume24h.toLocaleString()}`);
    console.log(`   Fee: ${pool.fee / 100}%`);
  });
  
  // Save pool registry data
  fs.writeFileSync(
    'src/data/poolRegistry.json',
    JSON.stringify(poolRegistry, null, 2)
  );
  
  // Update deployment config
  deployment.poolRegistry = {
    totalPools: poolRegistry.stats.totalPools,
    totalTVL: poolRegistry.stats.totalTVL,
    totalVolume24h: poolRegistry.stats.totalVolume24h,
    lastUpdated: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    'contracts/deploy/deployment.json',
    JSON.stringify(deployment, null, 2)
  );
  
  console.log('\n🎉 Pool Registry Setup Complete!');
  console.log('\n📊 Registry Statistics:');
  console.log(`   Total Pools: ${poolRegistry.stats.totalPools}`);
  console.log(`   Total TVL: $${poolRegistry.stats.totalTVL.toLocaleString()}`);
  console.log(`   24h Volume: $${poolRegistry.stats.totalVolume24h.toLocaleString()}`);
  console.log('\n🔗 Chain Distribution:');
  Object.entries(poolRegistry.chainPools).forEach(([chainId, pools]) => {
    const chainName = {
      '42161': 'Arbitrum One',
      '42170': 'Arbitrum Nova', 
      '421337': 'Demo Orbit L3'
    }[chainId] || `Chain ${chainId}`;
    console.log(`   ${chainName}: ${pools.length} pools`);
  });
  
  return poolRegistry;
}

// Helper function to create pool lookup utilities
function createPoolLookupUtils(poolRegistry) {
  return {
    // Find pools for token pair
    findPoolsForPair: (tokenA, tokenB) => {
      const pairKey = `${tokenA.toLowerCase()}-${tokenB.toLowerCase()}`;
      const poolIds = poolRegistry.pairMappings[pairKey] || [];
      return poolIds.map(id => poolRegistry.pools[id]);
    },
    
    // Get pools by chain
    getPoolsByChain: (chainId) => {
      const poolIds = poolRegistry.chainPools[chainId] || [];
      return poolIds.map(id => poolRegistry.pools[id]);
    },
    
    // Get pool by ID
    getPool: (poolId) => {
      return poolRegistry.pools[poolId];
    },
    
    // Get best pool for pair (highest TVL)
    getBestPoolForPair: (tokenA, tokenB) => {
      const pools = this.findPoolsForPair(tokenA, tokenB);
      return pools.reduce((best, current) => 
        current.stats.tvlUSD > best.stats.tvlUSD ? current : best
      );
    }
  };
}

if (require.main === module) {
  setupPools()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Pool setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPools, createPoolLookupUtils };