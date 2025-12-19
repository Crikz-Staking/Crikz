// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OrderTypes.sol";

library OrderManager {
    struct Order {
        uint256 amount;        // Staked amount in wei
        uint256 reputation;    // Calculated reputation based on multiplier
        uint8 orderType;       // Tier index (0-6)
        uint256 startTime;     // Timestamp when order was created
        uint256 duration;      // Lock duration in seconds
    }

    /**
     * @notice Creates a new order with reputation calculated from tier multiplier
     * @dev Uses OrderTypes library to get multiplier and calculate reputation
     * @param amount The staking amount
     * @param oType The order type index (0-6)
     * @param info The OrderType struct containing duration and multiplier
     * @param startTime The block timestamp when order is created
     * @return Order struct with calculated reputation
     */
    function createOrder(
        uint256 amount, 
        uint8 oType, 
        OrderTypes.OrderType memory info, 
        uint256 startTime
    ) internal pure returns (Order memory) {
        // Calculate reputation using tier-specific multiplier
        // Formula: reputation = (amount * multiplier) / 10^18
        // Example Tier 2 (Standard Run): 1000 tokens * 1.001 = 1001 tokens reputation
        uint256 reputation = (amount * info.reputationMultiplier) / 1e18;
        
        return Order({
            amount: amount,
            reputation: reputation,
            orderType: oType,
            startTime: startTime,
            duration: info.lockDuration
        });
    }

    /**
     * @notice Removes an order using swap-and-pop for gas efficiency
     * @dev Moves last element to deleted position, then pops
     * @param orders Storage array of orders
     * @param index Index of order to remove
     */
    function removeOrder(Order[] storage orders, uint256 index) internal {
        require(index < orders.length, "Invalid index");
        
        // Swap with last element and pop (gas efficient)
        orders[index] = orders[orders.length - 1];
        orders.pop();
    }

    /**
     * @notice Calculates time remaining until order unlock
     * @param order The order to check
     * @param currentTime The current block timestamp
     * @return timeRemaining Seconds until unlock (0 if already unlocked)
     */
    function getTimeRemaining(Order memory order, uint256 currentTime) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 unlockTime = order.startTime + order.duration;
        
        if (currentTime >= unlockTime) {
            return 0;
        }
        
        return unlockTime - currentTime;
    }

    /**
     * @notice Checks if an order is unlocked
     * @param order The order to check
     * @param currentTime The current block timestamp
     * @return bool True if order can be completed
     */
    function isUnlocked(Order memory order, uint256 currentTime) 
        internal 
        pure 
        returns (bool) 
    {
        return currentTime >= order.startTime + order.duration;
    }

    /**
     * @notice Gets the unlock timestamp for an order
     * @param order The order to check
     * @return unlockTime The timestamp when order can be completed
     */
    function getUnlockTime(Order memory order) internal pure returns (uint256) {
        return order.startTime + order.duration;
    }
}