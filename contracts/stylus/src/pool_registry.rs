// AquaFlow Pool Registry - Minimal onchain liquidity source tracking
// Hackathon-safe with simulated liquidity, production-ready architecture

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    storage::{StorageMap, StorageU256, StorageVec, StorageAddress, StorageBool},
    evm,
};

/// Pool metadata optimized for reads
/// Packed storage to minimize gas costs
#[derive(SolidityType, Clone)]
pub struct PoolInfo {
    pub pool_address: Address,
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: U256,
    pub reserve_b: U256,
    pub fee_bps: U256,        // Fee in basis points (30 = 0.3%)
    pub pool_type: u8,        // 0=Uniswap-v2, 1=Uniswap-v3, 2=Curve, 3=Balancer
    pub chain_id: U256,       // Chain where pool exists
    pub is_active: bool,      // Pool status
    pub last_updated: U256,   // Block number of last update
}

/// Pool statistics for routing optimization
#[derive(SolidityType, Clone)]
pub struct PoolStats {
    pub tvl_usd: U256,           // Total Value Locked in USD
    pub volume_24h_usd: U256,    // 24h volume in USD
    pub fees_24h_usd: U256,      // 24h fees collected
    pub price_impact_1k: U256,   // Price impact for $1k swap (bps)
    pub utilization_rate: U256,  // How much liquidity is being used (bps)
}

/// Token pair for efficient lookups
#[derive(SolidityType, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TokenPair {
    pub token_a: Address,
    pub token_b: Address,
}

impl TokenPair {
    /// Create normalized token pair (smaller address first)
    pub fn new(token_a: Address, token_b: Address) -> Self {
        if token_a < token_b {
            Self { token_a, token_b }
        } else {
            Self { token_a: token_b, token_b: token_a }
        }
    }
}

sol_storage! {
    pub struct PoolRegistry {
        // Core pool data - optimized for reads
        pools: StorageMap<U256, PoolInfo>,           // pool_id -> pool_info
        pool_stats: StorageMap<U256, PoolStats>,     // pool_id -> statistics
        pool_count: StorageU256,                     // Total number of pools
        
        // Fast lookups - O(1) access patterns
        pair_to_pools: StorageMap<TokenPair, StorageVec<U256>>, // token_pair -> pool_ids[]
        address_to_pool: StorageMap<Address, U256>,  // pool_address -> pool_id
        
        // Chain-specific indexing for cross-chain routing
        chain_pools: StorageMap<U256, StorageVec<U256>>, // chain_id -> pool_ids[]
        
        // Access control
        owner: StorageAddress,
        authorized_updaters: StorageMap<Address, bool>,
        
        // Registry settings
        min_tvl_threshold: StorageU256,              // Minimum TVL to be included
        max_price_impact: StorageU256,               // Maximum allowed price impact
        update_frequency: StorageU256,               // Minimum blocks between updates
        
        // Emergency controls
        paused: StorageBool,
        emergency_admin: StorageAddress,
    }
}

// Events for offchain indexing and monitoring
sol! {
    event PoolAdded(
        uint256 indexed pool_id,
        address indexed pool_address,
        address indexed token_a,
        address token_b,
        uint256 chain_id,
        uint8 pool_type
    );
    
    event PoolUpdated(
        uint256 indexed pool_id,
        uint256 reserve_a,
        uint256 reserve_b,
        uint256 tvl_usd,
        uint256 volume_24h
    );
    
    event PoolDeactivated(
        uint256 indexed pool_id,
        string reason
    );
    
    event RegistryConfigUpdated(
        uint256 min_tvl_threshold,
        uint256 max_price_impact,
        uint256 update_frequency
    );
}

#[external]
impl PoolRegistry {
    /// Initialize the pool registry
    pub fn initialize(
        &mut self,
        owner: Address,
        min_tvl: U256,
        max_impact: U256
    ) -> Result<(), Vec<u8>> {
        self.owner.set(owner);
        self.min_tvl_threshold.set(min_tvl);
        self.max_price_impact.set(max_impact);
        self.update_frequency.set(U256::from(100)); // 100 blocks (~20 minutes)
        self.paused.set(false);
        
        // Add owner as authorized updater
        self.authorized_updaters.setter(owner).set(true);
        
        Ok(())
    }
    
    /// Add new pool to registry (hackathon: simplified validation)
    pub fn add_pool(
        &mut self,
        pool_address: Address,
        token_a: Address,
        token_b: Address,
        fee_bps: U256,
        pool_type: u8,
        chain_id: U256
    ) -> Result<U256, Vec<u8>> {
        // Access control
        if !self.is_authorized_updater(msg::sender()) {
            return Err(b"Unauthorized".to_vec());
        }
        
        if self.paused.get() {
            return Err(b"Registry paused".to_vec());
        }
        
        // Validate inputs
        if pool_address == Address::ZERO || token_a == Address::ZERO || token_b == Address::ZERO {
            return Err(b"Invalid addresses".to_vec());
        }
        
        if token_a == token_b {
            return Err(b"Identical tokens".to_vec());
        }
        
        // Check if pool already exists
        let existing_pool_id = self.address_to_pool.get(pool_address);
        if existing_pool_id != U256::ZERO {
            return Err(b"Pool already exists".to_vec());
        }
        
        let pool_id = self.pool_count.get();
        
        // Get initial reserves (hackathon: simulated, production: call pool contract)
        let (reserve_a, reserve_b) = self.get_pool_reserves_hackathon(pool_address, token_a, token_b)?;
        
        // Create pool info
        let pool_info = PoolInfo {
            pool_address,
            token_a,
            token_b,
            reserve_a,
            reserve_b,
            fee_bps,
            pool_type,
            chain_id,
            is_active: true,
            last_updated: U256::from(block::number()),
        };
        
        // Store pool data
        self.pools.setter(pool_id).set(pool_info);
        self.address_to_pool.setter(pool_address).set(pool_id);
        
        // Update lookup indices
        let token_pair = TokenPair::new(token_a, token_b);
        let mut pair_pools = self.pair_to_pools.setter(token_pair);
        pair_pools.push(pool_id);
        
        let mut chain_pools = self.chain_pools.setter(chain_id);
        chain_pools.push(pool_id);
        
        // Initialize stats (hackathon: simulated data)
        let pool_stats = self.generate_hackathon_stats(reserve_a, reserve_b, fee_bps);
        self.pool_stats.setter(pool_id).set(pool_stats);
        
        // Increment counter
        self.pool_count.set(pool_id + U256::from(1));
        
        evm::log(PoolAdded {
            pool_id,
            pool_address,
            token_a,
            token_b,
            chain_id,
            pool_type,
        });
        
        Ok(pool_id)
    }
    
    /// Update pool reserves and statistics
    pub fn update_pool(&mut self, pool_id: U256) -> Result<(), Vec<u8>> {
        if !self.is_authorized_updater(msg::sender()) {
            return Err(b"Unauthorized".to_vec());
        }
        
        let mut pool = self.pools.get(pool_id);
        if pool.pool_address == Address::ZERO {
            return Err(b"Pool not found".to_vec());
        }
        
        // Rate limiting
        let blocks_since_update = U256::from(block::number()) - pool.last_updated;
        if blocks_since_update < self.update_frequency.get() {
            return Err(b"Update too frequent".to_vec());
        }
        
        // Get fresh reserves (hackathon: simulated, production: call pool contract)
        let (new_reserve_a, new_reserve_b) = self.get_pool_reserves_hackathon(
            pool.pool_address,
            pool.token_a,
            pool.token_b
        )?;
        
        // Update pool info
        pool.reserve_a = new_reserve_a;
        pool.reserve_b = new_reserve_b;
        pool.last_updated = U256::from(block::number());
        
        self.pools.setter(pool_id).set(pool);
        
        // Update statistics
        let new_stats = self.generate_hackathon_stats(new_reserve_a, new_reserve_b, pool.fee_bps);
        self.pool_stats.setter(pool_id).set(new_stats);
        
        evm::log(PoolUpdated {
            pool_id,
            reserve_a: new_reserve_a,
            reserve_b: new_reserve_b,
            tvl_usd: new_stats.tvl_usd,
            volume_24h: new_stats.volume_24h_usd,
        });
        
        Ok(())
    }
    
    /// Get pools for token pair (optimized for routing)
    pub fn get_pools_for_pair(
        &self,
        token_a: Address,
        token_b: Address
    ) -> Vec<U256> {
        let token_pair = TokenPair::new(token_a, token_b);
        let pair_pools = self.pair_to_pools.get(token_pair);
        
        // Convert StorageVec to Vec (hackathon simplification)
        let mut result = Vec::new();
        let len = pair_pools.len();
        
        for i in 0..len {
            let pool_id = pair_pools.get(i).unwrap_or(U256::ZERO);
            if pool_id != U256::ZERO {
                let pool = self.pools.get(pool_id);
                if pool.is_active {
                    result.push(pool_id);
                }
            }
        }
        
        result
    }
    
    /// Get pool info by ID
    pub fn get_pool_info(&self, pool_id: U256) -> PoolInfo {
        self.pools.get(pool_id)
    }
    
    /// Get pool statistics
    pub fn get_pool_stats(&self, pool_id: U256) -> PoolStats {
        self.pool_stats.get(pool_id)
    }
    
    /// Get pools on specific chain
    pub fn get_pools_by_chain(&self, chain_id: U256) -> Vec<U256> {
        let chain_pools = self.chain_pools.get(chain_id);
        let mut result = Vec::new();
        let len = chain_pools.len();
        
        for i in 0..len {
            let pool_id = chain_pools.get(i).unwrap_or(U256::ZERO);
            if pool_id != U256::ZERO {
                let pool = self.pools.get(pool_id);
                if pool.is_active {
                    result.push(pool_id);
                }
            }
        }
        
        result
    }
    
    /// Get total number of active pools
    pub fn get_active_pool_count(&self) -> U256 {
        // Simplified for hackathon - would iterate and count active pools in production
        self.pool_count.get()
    }
}

// Internal helper functions
impl PoolRegistry {
    fn is_authorized_updater(&self, user: Address) -> bool {
        user == self.owner.get() || self.authorized_updaters.get(user)
    }
    
    /// Hackathon: Generate simulated pool reserves
    /// Production: Call actual pool contracts to get real reserves
    fn get_pool_reserves_hackathon(
        &self,
        _pool_address: Address,
        _token_a: Address,
        _token_b: Address
    ) -> Result<(U256, U256), Vec<u8>> {
        // Simulated reserves for hackathon demo
        // In production, this would call:
        // - Uniswap V2: getReserves()
        // - Uniswap V3: slot0() + liquidity calculations
        // - Curve: get_balances()
        // - Balancer: getPoolTokens()
        
        let base_reserve = U256::from(1000000) * U256::from(10).pow(U256::from(18));
        let reserve_a = base_reserve + U256::from(block::number() % 100000) * U256::from(10).pow(U256::from(15));
        let reserve_b = base_reserve + U256::from((block::number() * 7) % 100000) * U256::from(10).pow(U256::from(15));
        
        Ok((reserve_a, reserve_b))
    }
    
    /// Hackathon: Generate realistic pool statistics
    /// Production: Calculate from onchain data and price feeds
    fn generate_hackathon_stats(&self, reserve_a: U256, reserve_b: U256, fee_bps: U256) -> PoolStats {
        // Simulate realistic TVL (assuming $1 per token for simplicity)
        let tvl_usd = (reserve_a + reserve_b) / U256::from(10).pow(U256::from(18));
        
        // Simulate 24h volume as 10-50% of TVL
        let volume_multiplier = 10 + (block::number() % 40);
        let volume_24h_usd = tvl_usd * U256::from(volume_multiplier) / U256::from(100);
        
        // Calculate fees from volume
        let fees_24h_usd = volume_24h_usd * fee_bps / U256::from(10000);
        
        // Simulate price impact for $1k swap
        let swap_amount = U256::from(1000) * U256::from(10).pow(U256::from(18));
        let price_impact_1k = if reserve_a > swap_amount {
            (swap_amount * U256::from(10000)) / reserve_a // Simplified impact calculation
        } else {
            U256::from(1000) // 10% max impact
        };
        
        // Utilization rate (how much liquidity is actively used)
        let utilization_rate = U256::from(20 + (block::number() % 60)); // 20-80%
        
        PoolStats {
            tvl_usd,
            volume_24h_usd,
            fees_24h_usd,
            price_impact_1k,
            utilization_rate,
        }
    }
}

// Administrative functions
#[external]
impl PoolRegistry {
    /// Add authorized updater (owner only)
    pub fn add_updater(&mut self, updater: Address) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Only owner".to_vec());
        }
        
        self.authorized_updaters.setter(updater).set(true);
        Ok(())
    }
    
    /// Emergency pause (owner or emergency admin)
    pub fn pause(&mut self) -> Result<(), Vec<u8>> {
        let sender = msg::sender();
        if sender != self.owner.get() && sender != self.emergency_admin.get() {
            return Err(b"Unauthorized".to_vec());
        }
        
        self.paused.set(true);
        Ok(())
    }
    
    /// Update registry configuration
    pub fn update_config(
        &mut self,
        min_tvl: U256,
        max_impact: U256,
        update_freq: U256
    ) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Only owner".to_vec());
        }
        
        self.min_tvl_threshold.set(min_tvl);
        self.max_price_impact.set(max_impact);
        self.update_frequency.set(update_freq);
        
        evm::log(RegistryConfigUpdated {
            min_tvl_threshold: min_tvl,
            max_price_impact: max_impact,
            update_frequency: update_freq,
        });
        
        Ok(())
    }
}

/*
POST-HACKATHON SCALING PLAN:

1. REAL DATA INTEGRATION:
   - Replace simulated reserves with actual pool contract calls
   - Integrate Chainlink price feeds for USD valuations
   - Add support for all major DEX protocols (Uniswap V2/V3, Curve, Balancer, etc.)

2. ADVANCED INDEXING:
   - Implement efficient data structures for complex queries
   - Add support for token-agnostic routing (find path A->B through any intermediates)
   - Optimize storage layout for gas efficiency

3. CROSS-CHAIN EXPANSION:
   - Add support for all Arbitrum chains (One, Nova, Orbit L3s)
   - Implement cross-chain liquidity aggregation
   - Add bridge integration for cross-chain routing

4. REAL-TIME UPDATES:
   - Implement keeper network for automated pool updates
   - Add event-based updates triggered by large swaps
   - Optimize update frequency based on pool volatility

5. ADVANCED FEATURES:
   - Pool quality scoring based on historical performance
   - MEV protection mechanisms
   - Integration with intent solvers and auction systems

6. GOVERNANCE:
   - Transition to DAO-controlled registry
   - Community-driven pool whitelisting
   - Incentive mechanisms for data providers

This registry is designed to be production-ready with minimal changes,
while being safe and functional for hackathon demonstration.
*/