// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AquaFlowWrapper
 * @dev Solidity wrapper for the Stylus AquaFlow router
 * Provides EVM compatibility and safe token handling
 */
contract AquaFlowWrapper is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Stylus router address (deployed separately)
    address public immutable stylusRouter;
    
    // Events
    event IntentSubmitted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    );
    
    event SwapCompleted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    // Intent structure matching Stylus contract
    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
    }
    
    constructor(address _stylusRouter) {
        require(_stylusRouter != address(0), "Invalid router address");
        stylusRouter = _stylusRouter;
    }
    
    /**
     * @dev Execute intent-based swap through Stylus router
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param minAmountOut Minimum output amount (slippage protection)
     * @param deadline Transaction deadline
     */
    function executeIntent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "Same token swap");
        require(amountIn > 0, "Amount must be > 0");
        require(deadline >= block.timestamp, "Expired deadline");
        
        // Transfer tokens from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Approve Stylus router
        IERC20(tokenIn).safeApprove(stylusRouter, amountIn);
        
        // Create intent
        Intent memory intent = Intent({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            deadline: deadline
        });
        
        emit IntentSubmitted(msg.sender, tokenIn, tokenOut, amountIn, minAmountOut);
        
        // Call Stylus router (simplified for hackathon)
        // In production, this would be a proper call to the Stylus contract
        amountOut = _simulateStyleusCall(intent);
        
        // Transfer output tokens to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        emit SwapCompleted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        return amountOut;
    }
    
    /**
     * @dev Get quote for swap (view function)
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        // Simplified quote calculation for hackathon
        // In production, this would call the Stylus contract's get_quote function
        return _calculateQuote(tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @dev Emergency token recovery (owner only)
     */
    function recoverToken(address token, uint256 amount) external {
        // Simplified for hackathon - would have proper access control
        IERC20(token).safeTransfer(msg.sender, amount);
    }
    
    // Internal functions
    
    /**
     * @dev Simulate Stylus router call for hackathon demo
     * In production, this would be replaced with actual Stylus contract interaction
     */
    function _simulateStylelusCall(Intent memory intent) internal pure returns (uint256) {
        // Simplified constant product formula for demo
        // Assumes 1:1 ratio with 0.3% fee for demonstration
        uint256 fee = intent.amountIn * 30 / 10000; // 0.3% fee
        return intent.amountIn - fee;
    }
    
    /**
     * @dev Calculate quote for demonstration
     */
    function _calculateQuote(
        address, // tokenIn
        address, // tokenOut  
        uint256 amountIn
    ) internal pure returns (uint256) {
        // Simplified for hackathon demo
        uint256 fee = amountIn * 30 / 10000; // 0.3% fee
        return amountIn - fee;
    }
}