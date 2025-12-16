// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CrikzMath.sol"; 
import "./OrderTypes.sol";

library OrderManager {
    using CrikzMath for uint256;

    error InvalidOrderIndex();
    error OrderStillLocked();

    struct Order {
        uint256 amount;
        uint8 orderType;
        uint256 reputation;
        uint256 lockUntil;
        uint256 startTime;
    }

    function createOrder(
        uint256 amount,
        uint8 orderType,
        OrderTypes.OrderType memory typeInfo,
        uint256 timestamp
    ) internal pure returns (Order memory) {
        return Order({
            amount: amount,
            orderType: orderType,
            reputation: CrikzMath.calculateReputation(amount, typeInfo.reputationMultiplier),
            lockUntil: timestamp + typeInfo.lockDuration,
            startTime: timestamp
        });
    }

    function isCompleted(Order memory order, uint256 timestamp) internal pure returns (bool) {
        return timestamp >= order.lockUntil;
    }

    function validateCompleted(Order memory order, uint256 timestamp) internal pure {
        if (!isCompleted(order, timestamp)) revert OrderStillLocked();
    }

    function getTimeRemaining(Order memory order, uint256 timestamp) internal pure returns (uint256) {
        if (timestamp >= order.lockUntil) return 0;
        return order.lockUntil - timestamp;
    }

    function removeOrder(Order[] storage orders, uint256 index) internal {
        if (index >= orders.length) revert InvalidOrderIndex();
        uint256 lastIndex = orders.length - 1;
        if (index != lastIndex) {
            orders[index] = orders[lastIndex];
        }
        orders.pop();
    }

    function updateOrderAmount(
        Order storage order,
        uint256 newAmount,
        OrderTypes.OrderType memory typeInfo
    ) internal returns (uint256 oldReputation, uint256 newReputation) {
        oldReputation = order.reputation;
        order.amount = newAmount;
        newReputation = CrikzMath.calculateReputation(newAmount, typeInfo.reputationMultiplier);
        order.reputation = newReputation;
        return (oldReputation, newReputation);
    }

    function validateOrderIndex(Order[] storage orders, uint256 index) internal view {
        if (index >= orders.length) revert InvalidOrderIndex();
    }
}