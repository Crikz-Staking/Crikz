// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library CrikzMath {
    uint256 public constant WAD = 1e18;
    uint256 public constant BASE_APR = 6182 * 10**13;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_ORDER_AMOUNT = 1 * WAD;

    error InvalidAmount();
    error InvalidReputation();
    error DivisionByZero();

    function calculateReputation(
        uint256 amount,
        uint256 reputationMultiplier
    ) internal pure returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        if (reputationMultiplier == 0) revert InvalidReputation();
        return (amount * reputationMultiplier) / WAD;
    }
    
    function calculateTimeBasedYield(
        uint256 rewardFundBalance,
        uint256 timeElapsed,
        uint256 totalReputation
    ) internal pure returns (uint256) {
        if (totalReputation == 0) return 0;
        if (rewardFundBalance == 0) return 0;
        
        uint256 yieldAmount = (rewardFundBalance * BASE_APR) / WAD;
        yieldAmount = (yieldAmount * timeElapsed) / SECONDS_PER_YEAR;
        
        return yieldAmount;
    }

    function calculateYieldPerReputation(
        uint256 yieldAccrued,
        uint256 totalReputation
    ) internal pure returns (uint256) {
        if (yieldAccrued == 0 || totalReputation == 0) return 0;
        return (yieldAccrued * WAD) / totalReputation;
    }

    function getBaseAPR() internal pure returns (uint256) {
        return BASE_APR;
    }
}