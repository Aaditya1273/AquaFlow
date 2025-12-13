// AquaFlow Stylus Router - Ultra-efficient intent-based liquidity routing
// Optimized for minimal gas and state usage on Arbitrum

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    storage::{StorageMap, StorageU256, StorageVec},
    call::Call,
    evm,
};

// Pool structure for liquidity sources
#[derive(SolidityType)]
pub struct Pool {
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: U256,
    pub reserve_b: U256,
    pub fee: U256, // basis points
    pub pool_address: Address,
}

// Intent structure for user requests
#[derive(SolidityType)]
pub struct Intent {
    pub user: Address,
    pub token_in: Address,
    pub token_out: Address,
    pub amount_in: U256,
    pub min_amount_out: U256,
    pub deadline: U256,
}

// Route step for multi-hop swaps
#[derive(SolidityType)]
pub struct RouteStep {
    pub pool_id: U256,
    pub token_in: Address,
    pub token_out: Address,
    pub amount_in: U256,
    pub amount_out: U256,
}

sol_storage! {
    #[entrypoint]
    pub struct AquaFlowRouter {
        // Pool registry - optimized for reads
        pools: StorageMap<U256, Pool>,
        pool_count: StorageU256,
        
        // Token pair to pool mapping for O(1) lookups
        pair_to_pool: StorageMap<(Address, Address), U256>,
        
        // Admin controls
        owner: StorageAddress,
        paused: StorageBool,
        
        // Fee collection
        protocol_fee: StorageU256, // basis points
        fee_recipient: StorageAddress,
    }
}

// Events for frontend visualization
sol! {
    event IntentExecuted(
        address indexed user,
        address indexed token_in,
        address indexed token_out,
        uint256 amount_in,
        uint256 amount_out,
        uint256 gas_used
    );
    
    event RouteComputed(
        address indexed user,
        uint256 route_length,
        uint256 estimated_gas,
        uint256 price_impact
    );
    
    event PoolAdded(
        uint256 indexed pool_id,
        address indexed token_a,
        address indexed token_b,
        address pool_address
    );
}

#[external]
impl AquaFlowRouter {
    // Initialize the router
    pub fn initialize(&mut self, owner: Address, fee_recipient: Address) -> Result<(), Vec<u8>> {
        self.owner.set(owner);
        self.fee_recipient.set(fee_recipient);
        self.protocol_fee.set(U256::from(30)); // 0.3% default
        self.paused.set(false);
        Ok(())
    }
    
    // Core intent execution - the magic happens here
    pub fn execute_intent(&mut self, intent: Intent) -> Result<U256, Vec<u8>> {
        // Gas tracking for benchmarking
        let gas_start = evm::gas_left();
        
        // Validate intent
        self.validate_intent(&intent)?;
        
        // Find optimal route (simplified for hackathon)
        let route = self.find_best_route(
            intent.token_in,
            intent.token_out,
            intent.amount_in
        )?;
        
        // Execute the route
        let amount_out = self.execute_route(&intent, &route)?;
        
        // Ensure minimum output
        if amount_out < intent.min_amount_out {
            return Err(b"Insufficient output amount".to_vec());
        }
        
        let gas_used = gas_start - evm::gas_left();
        
        // Emit event for frontend
        evm::log(IntentExecuted {
            user: intent.user,
            token_in: intent.token_in,
            token_out: intent.token_out,
            amount_in: intent.amount_in,
            amount_out,
            gas_used,
        });
        
        Ok(amount_out)
    }
    
    // Add liquidity pool to registry
    pub fn add_pool(
        &mut self,
        token_a: Address,
        token_b: Address,
        pool_address: Address,
        fee: U256
    ) -> Result<U256, Vec<u8>> {
        // Only owner can add pools (hackathon simplification)
        if msg::sender() != self.owner.get() {
            return Err(b"Only owner can add pools".to_vec());
        }
        
        let pool_id = self.pool_count.get();
        
        // Get reserves (simplified - would call pool contract in production)
        let (reserve_a, reserve_b) = self.get_pool_reserves(pool_address)?;
        
        let pool = Pool {
            token_a,
            token_b,
            reserve_a,
            reserve_b,
            fee,
            pool_address,
        };
        
        self.pools.setter(pool_id).set(pool);
        self.pair_to_pool.setter((token_a, token_b)).set(pool_id);
        self.pair_to_pool.setter((token_b, token_a)).set(pool_id);
        
        self.pool_count.set(pool_id + U256::from(1));
        
        evm::log(PoolAdded {
            pool_id,
            token_a,
            token_b,
            pool_address,
        });
        
        Ok(pool_id)
    }
    
    // Get quote for intent (view function)
    pub fn get_quote(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256
    ) -> Result<U256, Vec<u8>> {
        let route = self.find_best_route(token_in, token_out, amount_in)?;
        let amount_out = self.calculate_route_output(&route, amount_in)?;
        Ok(amount_out)
    }
}

// Internal helper functions
impl AquaFlowRouter {
    fn validate_intent(&self, intent: &Intent) -> Result<(), Vec<u8>> {
        if self.paused.get() {
            return Err(b"Router is paused".to_vec());
        }
        
        if intent.amount_in == U256::ZERO {
            return Err(b"Amount must be greater than zero".to_vec());
        }
        
        if intent.deadline < U256::from(block::timestamp()) {
            return Err(b"Transaction expired".to_vec());
        }
        
        Ok(())
    }
    
    fn find_best_route(
        &self,
        token_in: Address,
        token_out: Address,
        amount_in: U256
    ) -> Result<Vec<RouteStep>, Vec<u8>> {
        // Simplified routing for hackathon - direct swap only
        // Production would implement multi-hop routing with graph algorithms
        
        let pool_id = self.pair_to_pool.get((token_in, token_out));
        if pool_id == U256::ZERO {
            return Err(b"No pool found for pair".to_vec());
        }
        
        let pool = self.pools.get(pool_id);
        let amount_out = self.calculate_swap_output(&pool, token_in, amount_in)?;
        
        let route_step = RouteStep {
            pool_id,
            token_in,
            token_out,
            amount_in,
            amount_out,
        };
        
        Ok(vec![route_step])
    }
    
    fn execute_route(
        &mut self,
        intent: &Intent,
        route: &[RouteStep]
    ) -> Result<U256, Vec<u8>> {
        // Simplified execution - would handle token transfers in production
        let mut current_amount = intent.amount_in;
        
        for step in route {
            // Update pool reserves (simplified)
            let mut pool = self.pools.get(step.pool_id);
            
            if step.token_in == pool.token_a {
                pool.reserve_a = pool.reserve_a + step.amount_in;
                pool.reserve_b = pool.reserve_b - step.amount_out;
            } else {
                pool.reserve_b = pool.reserve_b + step.amount_in;
                pool.reserve_a = pool.reserve_a - step.amount_out;
            }
            
            self.pools.setter(step.pool_id).set(pool);
            current_amount = step.amount_out;
        }
        
        Ok(current_amount)
    }
    
    fn calculate_swap_output(
        &self,
        pool: &Pool,
        token_in: Address,
        amount_in: U256
    ) -> Result<U256, Vec<u8>> {
        // Constant product formula: x * y = k
        let (reserve_in, reserve_out) = if token_in == pool.token_a {
            (pool.reserve_a, pool.reserve_b)
        } else {
            (pool.reserve_b, pool.reserve_a)
        };
        
        if reserve_in == U256::ZERO || reserve_out == U256::ZERO {
            return Err(b"Insufficient liquidity".to_vec());
        }
        
        // Apply fee
        let fee_multiplier = U256::from(10000) - pool.fee;
        let amount_in_with_fee = amount_in * fee_multiplier / U256::from(10000);
        
        // Calculate output
        let numerator = amount_in_with_fee * reserve_out;
        let denominator = reserve_in + amount_in_with_fee;
        let amount_out = numerator / denominator;
        
        Ok(amount_out)
    }
    
    fn calculate_route_output(
        &self,
        route: &[RouteStep],
        _amount_in: U256
    ) -> Result<U256, Vec<u8>> {
        if route.is_empty() {
            return Err(b"Empty route".to_vec());
        }
        
        Ok(route.last().unwrap().amount_out)
    }
    
    fn get_pool_reserves(&self, _pool_address: Address) -> Result<(U256, U256), Vec<u8>> {
        // Simplified for hackathon - would call actual pool contract
        Ok((U256::from(1000000), U256::from(1000000)))
    }
}