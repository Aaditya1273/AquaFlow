// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AquaFlowFaucet
 * @dev Testnet token faucet for AquaFlow platform
 * Allows users to get free testnet tokens for testing swaps
 */
contract AquaFlowFaucet is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Faucet configuration
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    uint256 public constant MAX_TOKENS_PER_REQUEST = 1000 * 10**18; // 1000 tokens max
    
    // Supported tokens and their faucet amounts
    mapping(address => uint256) public tokenAmounts;
    mapping(address => bool) public supportedTokens;
    
    // User cooldowns per token
    mapping(address => mapping(address => uint256)) public lastClaim;
    
    // Events
    event TokensDistributed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenAdded(
        address indexed token,
        uint256 amount,
        address indexed addedBy
    );
    
    event TokenRemoved(
        address indexed token,
        address indexed removedBy
    );
    
    constructor() {}
    
    /**
     * @dev Add a token to the faucet
     * @param token Token contract address
     * @param amount Amount to distribute per request
     */
    function addToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0 && amount <= MAX_TOKENS_PER_REQUEST, "Invalid amount");
        
        supportedTokens[token] = true;
        tokenAmounts[token] = amount;
        
        emit TokenAdded(token, amount, msg.sender);
    }
    
    /**
     * @dev Remove a token from the faucet
     * @param token Token contract address
     */
    function removeToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        
        supportedTokens[token] = false;
        tokenAmounts[token] = 0;
        
        emit TokenRemoved(token, msg.sender);
    }
    
    /**
     * @dev Request tokens from faucet
     * @param token Token contract address
     */
    function requestTokens(address token) external nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(
            block.timestamp >= lastClaim[msg.sender][token] + COOLDOWN_PERIOD,
            "Cooldown period not met"
        );
        
        uint256 amount = tokenAmounts[token];
        require(amount > 0, "Invalid token amount");
        
        // Check faucet balance
        uint256 faucetBalance = IERC20(token).balanceOf(address(this));
        require(faucetBalance >= amount, "Insufficient faucet balance");
        
        // Update last claim timestamp
        lastClaim[msg.sender][token] = block.timestamp;
        
        // Transfer tokens to user
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit TokensDistributed(msg.sender, token, amount, block.timestamp);
    }
    
    /**
     * @dev Batch request multiple tokens
     * @param tokens Array of token addresses
     */
    function requestMultipleTokens(address[] calldata tokens) external {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (supportedTokens[tokens[i]] && 
                block.timestamp >= lastClaim[msg.sender][tokens[i]] + COOLDOWN_PERIOD) {
                
                uint256 amount = tokenAmounts[tokens[i]];
                uint256 faucetBalance = IERC20(tokens[i]).balanceOf(address(this));
                
                if (amount > 0 && faucetBalance >= amount) {
                    lastClaim[msg.sender][tokens[i]] = block.timestamp;
                    IERC20(tokens[i]).safeTransfer(msg.sender, amount);
                    emit TokensDistributed(msg.sender, tokens[i], amount, block.timestamp);
                }
            }
        }
    }
    
    /**
     * @dev Check if user can claim tokens
     * @param user User address
     * @param token Token address
     * @return canClaim Whether user can claim
     * @return timeLeft Time left until next claim (0 if can claim now)
     */
    function canClaim(address user, address token) 
        external 
        view 
        returns (bool canClaim, uint256 timeLeft) 
    {
        if (!supportedTokens[token]) {
            return (false, 0);
        }
        
        uint256 nextClaimTime = lastClaim[user][token] + COOLDOWN_PERIOD;
        
        if (block.timestamp >= nextClaimTime) {
            return (true, 0);
        } else {
            return (false, nextClaimTime - block.timestamp);
        }
    }
    
    /**
     * @dev Get faucet info for a token
     * @param token Token address
     * @return isSupported Whether token is supported
     * @return amount Amount distributed per request
     * @return balance Current faucet balance
     */
    function getFaucetInfo(address token) 
        external 
        view 
        returns (bool isSupported, uint256 amount, uint256 balance) 
    {
        isSupported = supportedTokens[token];
        amount = tokenAmounts[token];
        balance = IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Get all supported tokens info
     * @param tokens Array of token addresses to check
     * @return supportedList Array of booleans indicating support
     * @return amounts Array of amounts per request
     * @return balances Array of current faucet balances
     */
    function getMultipleFaucetInfo(address[] calldata tokens)
        external
        view
        returns (
            bool[] memory supportedList,
            uint256[] memory amounts,
            uint256[] memory balances
        )
    {
        supportedList = new bool[](tokens.length);
        amounts = new uint256[](tokens.length);
        balances = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            supportedList[i] = supportedTokens[tokens[i]];
            amounts[i] = tokenAmounts[tokens[i]];
            balances[i] = IERC20(tokens[i]).balanceOf(address(this));
        }
    }
    
    /**
     * @dev Emergency token recovery (owner only)
     * @param token Token address (use address(0) for ETH)
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            // Recover ETH
            payable(owner()).transfer(amount);
        } else {
            // Recover ERC20 tokens
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    /**
     * @dev Fund faucet with tokens (anyone can fund)
     * @param token Token address
     * @param amount Amount to fund
     */
    function fundFaucet(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}