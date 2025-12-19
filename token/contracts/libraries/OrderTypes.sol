// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library OrderTypes {
    struct OrderType {
        uint256 duration;
        uint256 reputationMultiplier;
    }

    uint8 public constant MAX_ORDER_TYPE = 6;

    function initializeOrderTypes() internal pure returns (OrderType[7] memory types) {
        types[0] = OrderType(1 days, 100);        // Prototype: 1 day
        types[1] = OrderType(7 days, 150);        // Short Run: 7 days
        types[2] = OrderType(30 days, 200);       // Standard Run: 30 days
        types[3] = OrderType(90 days, 250);       // Extended Production: 90 days
        types[4] = OrderType(180 days, 300);      // Industrial: 180 days
        types[5] = OrderType(365 days, 400);      // Annual Contract: 365 days
        types[6] = OrderType(730 days, 500);      // Multi-Year: 730 days
        return types;
    }
}