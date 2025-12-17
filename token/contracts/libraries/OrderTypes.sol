// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library OrderTypes {
    struct OrderType {
        uint256 duration;
        uint256 reputationMultiplier;
    }

    uint8 public constant MAX_ORDER_TYPE = 6;

    function initializeOrderTypes() internal pure returns (OrderType[7] memory types) {
        types[0] = OrderType(1 days, 100);
        types[1] = OrderType(7 days, 150);
        types[2] = OrderType(30 days, 200);
        // ... fill others as per your spec
        return types;
    }
}