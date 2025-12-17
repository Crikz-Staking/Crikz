// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library CrikzMath {
    uint256 public constant WAD = 1e18;
    uint256 public constant MIN_ORDER_AMOUNT = 10 * 1e18;

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}