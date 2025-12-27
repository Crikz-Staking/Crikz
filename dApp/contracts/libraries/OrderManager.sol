// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./OrderTypes.sol";

library OrderManager {
    struct Order {
        uint256 amount;
        uint256 reputation;
        uint8 orderType;
        uint256 startTime;
        uint256 duration;
    }

    function createOrder(
        uint256 amount, 
        uint8 oType, 
        OrderTypes.OrderType memory info, 
        uint256 startTime
    ) internal pure returns (Order memory) {
        uint256 reputation = (amount * info.reputationMultiplier) / 1e18;
        return Order({
            amount: amount,
            reputation: reputation,
            orderType: oType,
            startTime: startTime,
            duration: info.lockDuration
        });
    }

    function removeOrder(Order[] storage orders, uint256 index) internal {
        require(index < orders.length, "Invalid index");
        orders[index] = orders[orders.length - 1];
        orders.pop();
    }

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

    function isUnlocked(Order memory order, uint256 currentTime) 
        internal 
        pure 
        returns (bool) 
    {
        return currentTime >= order.startTime + order.duration;
    }

    function getUnlockTime(Order memory order) internal pure returns (uint256) {
        return order.startTime + order.duration;
    }
}