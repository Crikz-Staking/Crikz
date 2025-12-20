// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/OrderTypes.sol";
import "../libraries/OrderManager.sol";

contract LibraryHarness {
    function testGetTierName(uint8 index) external pure returns (string memory) {
        return OrderTypes.getTierName(index);
    }

    function testGetLockDuration(uint8 index) external pure returns (uint256) {
        return OrderTypes.getLockDuration(index);
    }

    function testCalculateReputation(uint256 amount, uint8 index) external pure returns (uint256) {
        return OrderTypes.calculateReputation(amount, index);
    }

    // Line 17: Coverage for getUnlockTime
    function testGetUnlockTime(uint256 start, uint256 duration) external pure returns (uint256) {
        OrderManager.Order memory order = OrderManager.Order(0, 0, 0, start, duration);
        return OrderManager.getUnlockTime(order);
    }

    // Line 18: Coverage for getTimeRemaining
    function testGetTimeRemaining(uint256 start, uint256 duration, uint256 current) external pure returns (uint256) {
        OrderManager.Order memory order = OrderManager.Order(0, 0, 0, start, duration);
        return OrderManager.getTimeRemaining(order, current);
    }
}