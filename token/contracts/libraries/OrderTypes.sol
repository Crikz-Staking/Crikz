// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library OrderTypes {
    struct OrderType {
        uint256 lockDuration;          // Lock period in seconds
        uint256 reputationMultiplier;  // Multiplier with 18 decimals (e.g., 1.001 = 1001 * 10^15)
        string name;                   // Human-readable tier name
    }

    uint8 public constant MAX_ORDER_TYPE = 6;

    /**
     * @notice Initializes order types with Fibonacci-based lock durations
     * @dev Lock durations follow Fibonacci sequence: 5, 13, 34, 89, 233, 610, 1597 days
     * @dev Reputation multipliers scale with golden ratio principles
     * @return types Array of 7 order types with increasing commitment levels
     */
    function initializeOrderTypes() internal pure returns (OrderType[7] memory) {
        OrderType[7] memory types;
        
        types[0] = OrderType({
            lockDuration: 5 days,                // 5 days (Fibonacci)
            reputationMultiplier: 618 * 10**15,  // 0.618x (Golden Ratio φ - 1)
            name: "Prototype"
        });
        
        types[1] = OrderType({
            lockDuration: 13 days,               // 13 days (Fibonacci)
            reputationMultiplier: 787 * 10**15,  // 0.787x (√φ)
            name: "Small Batch"
        });
        
        types[2] = OrderType({
            lockDuration: 34 days,               // 34 days (Fibonacci)
            reputationMultiplier: 1001 * 10**15, // 1.001x (Just over parity)
            name: "Standard Run"
        });
        
        types[3] = OrderType({
            lockDuration: 89 days,               // 89 days (Fibonacci)
            reputationMultiplier: 1273 * 10**15, // 1.273x (Fibonacci ratio)
            name: "Mass Production"
        });
        
        types[4] = OrderType({
            lockDuration: 233 days,              // 233 days (Fibonacci)
            reputationMultiplier: 1619 * 10**15, // 1.619x (Close to φ)
            name: "Industrial"
        });
        
        types[5] = OrderType({
            lockDuration: 610 days,              // 610 days (Fibonacci)
            reputationMultiplier: 2059 * 10**15, // 2.059x (φ²/√2)
            name: "Global Scale"
        });
        
        types[6] = OrderType({
            lockDuration: 1597 days,             // 1597 days (Fibonacci)
            reputationMultiplier: 2618 * 10**15, // 2.618x (φ²)
            name: "Monopoly"
        });
        
        return types;
    }

    /**
     * @notice Gets a specific order type by index
     * @dev Helper function to retrieve order type details
     * @param index The tier index (0-6)
     * @return OrderType struct for the specified tier
     */
    function getOrderType(uint8 index) internal pure returns (OrderType memory) {
        require(index <= MAX_ORDER_TYPE, "Invalid order type");
        OrderType[7] memory types = initializeOrderTypes();
        return types[index];
    }

    /**
     * @notice Calculates reputation for a given amount and tier
     * @dev Uses the tier's reputation multiplier (18 decimals precision)
     * @param amount The staking amount in wei
     * @param orderTypeIndex The tier index (0-6)
     * @return reputation The calculated reputation value
     */
    function calculateReputation(uint256 amount, uint8 orderTypeIndex) internal pure returns (uint256) {
        require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        OrderType memory orderType = getOrderType(orderTypeIndex);
        
        // Formula: reputation = (amount * multiplier) / 10^18
        // Example: 1000 tokens * 1.001 = (1000 * 10^18 * 1001 * 10^15) / 10^18 = 1001 * 10^18
        return (amount * orderType.reputationMultiplier) / 1e18;
    }

    /**
     * @notice Returns lock duration for a specific tier
     * @param orderTypeIndex The tier index (0-6)
     * @return duration Lock duration in seconds
     */
    function getLockDuration(uint8 orderTypeIndex) internal pure returns (uint256) {
        require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        OrderType memory orderType = getOrderType(orderTypeIndex);
        return orderType.lockDuration;
    }

    /**
     * @notice Returns human-readable name for a tier
     * @param orderTypeIndex The tier index (0-6)
     * @return name The tier name
     */
    function getTierName(uint8 orderTypeIndex) internal pure returns (string memory) {
        require(orderTypeIndex <= MAX_ORDER_TYPE, "Invalid order type");
        OrderType memory orderType = getOrderType(orderTypeIndex);
        return orderType.name;
    }
}