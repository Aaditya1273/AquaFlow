// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract SimpleFaucet {
    address public owner;
    uint256 public constant COOLDOWN_TIME = 24 hours;
    
    // Token address => user address => last claim time
    mapping(address => mapping(address => uint256)) public lastClaimTime;
    
    // Token address => faucet amount
    mapping(address => uint256) public faucetAmounts;
    
    event TokensClaimed(address indexed user, address indexed token, uint256 amount);
    event TokenAdded(address indexed token, uint256 amount);
    event FaucetAmountUpdated(address indexed token, uint256 newAmount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function addToken(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        faucetAmounts[tokenAddress] = amount;
        emit TokenAdded(tokenAddress, amount);
    }
    
    function updateFaucetAmount(address tokenAddress, uint256 newAmount) external onlyOwner {
        require(faucetAmounts[tokenAddress] > 0, "Token not supported");
        require(newAmount > 0, "Amount must be greater than 0");
        
        faucetAmounts[tokenAddress] = newAmount;
        emit FaucetAmountUpdated(tokenAddress, newAmount);
    }
    
    function claimTokens(address tokenAddress) external {
        require(faucetAmounts[tokenAddress] > 0, "Token not supported");
        require(canClaim(msg.sender, tokenAddress), "Cooldown period active");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 amount = faucetAmounts[tokenAddress];
        
        require(token.balanceOf(address(this)) >= amount, "Insufficient faucet balance");
        
        lastClaimTime[tokenAddress][msg.sender] = block.timestamp;
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        emit TokensClaimed(msg.sender, tokenAddress, amount);
    }
    
    function canClaim(address user, address tokenAddress) public view returns (bool) {
        return block.timestamp >= lastClaimTime[tokenAddress][user] + COOLDOWN_TIME;
    }
    
    function timeUntilNextClaim(address user, address tokenAddress) external view returns (uint256) {
        uint256 nextClaimTime = lastClaimTime[tokenAddress][user] + COOLDOWN_TIME;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    // Emergency functions
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Transfer failed");
    }
    
    function emergencyWithdrawETH() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}