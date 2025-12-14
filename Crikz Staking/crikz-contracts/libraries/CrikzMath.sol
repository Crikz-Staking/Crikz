// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CrikzMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant BURN_FEE_NUMERATOR = 1618;
    uint256 internal constant FEE_DENOMINATOR = 100000;
    uint256 internal constant BASE_APR_RATE = 618 * 10**15;
    uint256 internal constant SECONDS_PER_YEAR = 365 days;
    uint256 internal constant MIN_STAKE_AMOUNT = 1e6;

    function calculateBurnFee(uint256 amount) internal pure returns (uint256) {
        return (amount * BURN_FEE_NUMERATOR) / FEE_DENOMINATOR;
    }

    function calculateWeight(uint256 amount, uint256 weightFactor) internal pure returns (uint256) {
        return (amount * weightFactor) / WAD;
    }

    function calculateRewardPerWeight(
        uint256 rewardAmount,
        uint256 totalWeight
    ) internal pure returns (uint256) {
        if (totalWeight == 0) return 0;
        return (rewardAmount * WAD) / totalWeight;
    }

    function calculateTimeBasedRewards(
        uint256 poolBalance,
        uint256 timeElapsed,
        uint256 totalWeight
    ) internal pure returns (uint256) {
        if (totalWeight == 0 || poolBalance == 0) return 0;
        
        uint256 annualReward = (poolBalance * BASE_APR_RATE) / WAD;
        return (annualReward * timeElapsed) / SECONDS_PER_YEAR;
    }

    function mulWad(uint256 x, uint256 y) internal pure returns (uint256) {
        return (x * y) / WAD;
    }

    function divWad(uint256 x, uint256 y) internal pure returns (uint256) {
        require(y != 0, "Division by zero");
        return (x * WAD) / y;
    }
}