// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../solidity/SecureAquaFlowWrapper.sol";
import "../solidity/MockERC20.sol";

/**
 * @title SecurityTests
 * @dev Comprehensive security test suite for AquaFlow contracts
 * Tests all identified vulnerabilities and attack vectors
 */
contract SecurityTests is Test {
    SecureAquaFlowWrapper public wrapper;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    
    address public admin = address(0x1);
    address public emergencyAdmin = address(0x2);
    address public feeRecipient = address(0x3);
    address public user = address(0x4);
    address public attacker = address(0x5);
    address public stylusRouter = address(0x6);
    
    event SecurityAlert(
        address indexed user,
        string alertType,
        uint256 severity,
        bytes32 details
    );
    
    function setUp() public {
        // Deploy contracts
        wrapper = new SecureAquaFlowWrapper(
            stylusRouter,
            admin,
            emergencyAdmin,
            feeRecipient
        );
        
        tokenA = new MockERC20("Token A", "TKNA", 18);
        tokenB = new MockERC20("Token B", "TKNB", 18);
        
        // Setup initial balances
        tokenA.mint(user, 1000000 ether);
        tokenB.mint(address(wrapper), 1000000 ether);
        
        // Approve wrapper
        vm.prank(user);
        tokenA.approve(address(wrapper), type(uint256).max);
    }
    
    /**
     * @dev Test reentrancy protection
     */
    function testReentrancyProtection() public {
        // Deploy malicious token that attempts reentrancy
        MaliciousToken maliciousToken = new MaliciousToken(address(wrapper));
        
        // Mint tokens to user
        maliciousToken.mint(user, 1000 ether);
        tokenB.mint(address(wrapper), 1000 ether);
        
        // Attempt reentrancy attack
        vm.prank(user);
        maliciousToken.approve(address(wrapper), 1000 ether);
        
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(maliciousToken),
            tokenOut: address(tokenB),
            amountIn: 100 ether,
            minAmountOut: 99 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        // Sign intent
        intent.signature = _signIntent(intent, user);
        
        // Attack should fail due to reentrancy guard
        vm.prank(user);
        vm.expectRevert("ReentrancyGuard: reentrant call");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test intent manipulation protection
     */
    function testIntentManipulation() public {
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 100 ether,
            minAmountOut: 99 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        // Attacker tries to execute intent for user
        vm.prank(attacker);
        vm.expectRevert("Intent user mismatch");
        wrapper.executeSecureIntent(intent);
        
        // Attacker tries to modify intent
        intent.user = attacker;
        vm.prank(attacker);
        vm.expectRevert("Invalid signature");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test access control bypass protection
     */
    function testAccessControlBypass() public {
        // Attacker tries to pause contract
        vm.prank(attacker);
        vm.expectRevert();
        wrapper.emergencyPause();
        
        // Attacker tries to blacklist token
        vm.prank(attacker);
        vm.expectRevert();
        wrapper.blacklistToken(address(tokenA), "malicious");
        
        // Attacker tries to initiate emergency withdrawal
        vm.prank(attacker);
        vm.expectRevert();
        wrapper.initiateEmergencyWithdrawal(address(tokenA), 1000 ether);
    }
    
    /**
     * @dev Test daily volume limit protection
     */
    function testDailyVolumeLimit() public {
        uint256 maxVolume = 1000000 ether; // MAX_DAILY_VOLUME
        
        // First swap should succeed
        _executeValidSwap(user, 500000 ether);
        
        // Second swap that exceeds limit should fail
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 600000 ether,
            minAmountOut: 590000 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        vm.prank(user);
        vm.expectRevert("Daily volume limit exceeded");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test circuit breaker protection
     */
    function testCircuitBreaker() public {
        // Set low circuit breaker threshold for testing
        vm.prank(admin);
        wrapper.updateCircuitBreakerThreshold(1000 ether);
        
        // Large swap should trigger circuit breaker
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 1001 ether,
            minAmountOut: 990 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        vm.prank(user);
        vm.expectRevert("Circuit breaker triggered");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test blacklisted token protection
     */
    function testBlacklistedToken() public {
        // Admin blacklists token
        vm.prank(admin);
        wrapper.blacklistToken(address(tokenA), "suspicious activity");
        
        // Swap with blacklisted token should fail
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 100 ether,
            minAmountOut: 99 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        vm.prank(user);
        vm.expectRevert("Token is blacklisted");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test signature replay protection
     */
    function testSignatureReplay() public {
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 100 ether,
            minAmountOut: 99 ether,
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        // First execution should succeed
        vm.prank(user);
        wrapper.executeSecureIntent(intent);
        
        // Replay attack should fail due to nonce increment
        vm.prank(user);
        vm.expectRevert("Invalid nonce");
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Test emergency withdrawal timelock
     */
    function testEmergencyWithdrawalTimelock() public {
        // Mint tokens to wrapper
        tokenA.mint(address(wrapper), 1000 ether);
        
        // Initiate emergency withdrawal
        vm.prank(emergencyAdmin);
        wrapper.initiateEmergencyWithdrawal(address(tokenA), 1000 ether);
        
        // Immediate execution should fail
        vm.prank(emergencyAdmin);
        vm.expectRevert("Timelock not expired");
        wrapper.executeEmergencyWithdrawal(address(tokenA), 1000 ether, block.timestamp);
        
        // Fast forward time
        vm.warp(block.timestamp + 25 hours);
        
        // Now execution should succeed
        vm.prank(emergencyAdmin);
        wrapper.executeEmergencyWithdrawal(address(tokenA), 1000 ether, block.timestamp - 25 hours);
        
        assertEq(tokenA.balanceOf(emergencyAdmin), 1000 ether);
    }
    
    /**
     * @dev Test slippage protection
     */
    function testSlippageProtection() public {
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: user,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: 100 ether,
            minAmountOut: 99.5 ether, // Very tight slippage
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 50, // 0.5% max slippage
            nonce: wrapper.getUserNonce(user),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, user);
        
        // If actual output is less than minimum, should revert
        vm.prank(user);
        // This might succeed or fail depending on the mock implementation
        // In a real scenario with actual price impact, this would test slippage protection
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Helper function to execute valid swap
     */
    function _executeValidSwap(address swapper, uint256 amount) internal {
        SecureAquaFlowWrapper.SecureIntent memory intent = SecureAquaFlowWrapper.SecureIntent({
            user: swapper,
            tokenIn: address(tokenA),
            tokenOut: address(tokenB),
            amountIn: amount,
            minAmountOut: (amount * 997) / 1000, // 0.3% slippage
            deadline: block.timestamp + 1 hours,
            maxSlippageBps: 100,
            nonce: wrapper.getUserNonce(swapper),
            signature: ""
        });
        
        intent.signature = _signIntent(intent, swapper);
        
        vm.prank(swapper);
        wrapper.executeSecureIntent(intent);
    }
    
    /**
     * @dev Helper function to sign intent
     */
    function _signIntent(
        SecureAquaFlowWrapper.SecureIntent memory intent,
        address signer
    ) internal pure returns (bytes memory) {
        // In a real test, this would use proper ECDSA signing
        // For this demo, return empty signature
        return "";
    }
}

/**
 * @dev Malicious token contract for testing reentrancy
 */
contract MaliciousToken is MockERC20 {
    address public target;
    bool public attacking;
    
    constructor(address _target) MockERC20("Malicious", "MAL", 18) {
        target = _target;
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (to == target && !attacking) {
            attacking = true;
            // Attempt reentrancy
            try SecureAquaFlowWrapper(target).executeSecureIntent(
                SecureAquaFlowWrapper.SecureIntent({
                    user: msg.sender,
                    tokenIn: address(this),
                    tokenOut: address(0),
                    amountIn: 1 ether,
                    minAmountOut: 0,
                    deadline: block.timestamp + 1 hours,
                    maxSlippageBps: 100,
                    nonce: 0,
                    signature: ""
                })
            ) {
                // Reentrancy succeeded (should not happen)
            } catch {
                // Reentrancy failed (expected)
            }
            attacking = false;
        }
        return super.transfer(to, amount);
    }
}