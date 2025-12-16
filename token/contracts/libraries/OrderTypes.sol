// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library OrderTypes {
    uint8 public constant MAX_ORDER_TYPE = 6;

    struct OrderType {
        uint256 lockDuration;
        uint256 reputationMultiplier;
        string name;
    }

    error InvalidOrderType();

    function initializeOrderTypes() internal pure returns (OrderType[7] memory) {
        OrderType[7] memory types;
        types[0] = OrderType({
            lockDuration: 5 days,
            reputationMultiplier: 618 * 10**15,
            name: "Prototype"
        });
        types[1] = OrderType({
            lockDuration: 13 days,
            reputationMultiplier: 787 * 10**15,
            name: "Small Batch"
        });
        types[2] = OrderType({
            lockDuration: 34 days,
            reputationMultiplier: 1001 * 10**15,
            name: "Standard Run"
        });
        types[3] = OrderType({
            lockDuration: 89 days,
            reputationMultiplier: 1273 * 10**15,
            name: "Mass Production"
        });
        types[4] = OrderType({
            lockDuration: 233 days,
            reputationMultiplier: 1619 * 10**15,
            name: "Industrial"
        });
        types[5] = OrderType({
            lockDuration: 610 days,
            reputationMultiplier: 2059 * 10**15,
            name: "Global Scale"
        });
        types[6] = OrderType({
            lockDuration: 1597 days,
            reputationMultiplier: 2618 * 10**15,
            name: "Monopoly"
        });
        return types;
    }
    
    function isValidOrderType(uint8 typeIndex) internal pure returns (bool) {
        return typeIndex <= MAX_ORDER_TYPE;
    }

    function validateOrderType(uint8 typeIndex) internal pure {
        if (!isValidOrderType(typeIndex)) revert InvalidOrderType();
    }
}