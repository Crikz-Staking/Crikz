// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CrikzMath {
    // Standard 18 decimal precision unit
    uint256 public constant WAD = 1e18;

    // Fee parameters (1.618% Fee)
    uint256 private constant BURN_FEE_NUMERATOR = 1618;
    uint256 private constant FEE_DENOMINATOR = 100000;

    // Reward parameters
    // Base APR: 6.18% (618 * 10^15)
    uint256 public constant BASE_APR_RATE = 618 * 10**15; 
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    // Minimum stake amount to prevent dust spam (1 Token)
    uint256 public constant MIN_STAKE_AMOUNT = 1 * WAD; 

    /**
     * @notice Calculates the burn fee based on the amount.
     */
    function calculateBurnFee(uint256 amount) internal pure returns (uint256) {
        return (amount * BURN_FEE_NUMERATOR) / FEE_DENOMINATOR;
    }

    /**
     * @notice Calculates the staking weight based on amount and tier factor.
     */
    function calculateWeight(uint256 amount, uint256 weightFactor) internal pure returns (uint256) {
        // weight = amount * (weightFactor / WAD)
        return (amount * weightFactor) / WAD;
    }
    
    /**
     * @notice Calculates time-based rewards accrued into the pool's accumulated per weight rate.
     */
    function calculateTimeBasedRewards(
        uint256 poolBalance, 
        uint256 timeElapsed, 
        uint256 totalWeight
    ) internal pure returns (uint256 rewardsAccrued) {
        if (totalWeight == 0) return 0;

        // rewards = poolBalance * BASE_APR_RATE * timeElapsed / SECONDS_PER_YEAR / WAD
        rewardsAccrued = (poolBalance * BASE_APR_RATE) / WAD;
        rewardsAccrued = (rewardsAccrued * timeElapsed) / SECONDS_PER_YEAR;

        return rewardsAccrued;
    }

    /**
     * @notice Calculates the change in accumulated reward per weight.
     */
    function calculateRewardPerWeight(uint256 rewardsAccrued, uint256 totalWeight) internal pure returns (uint256) {
        if (rewardsAccrued == 0 || totalWeight == 0) return 0;
        return (rewardsAccrued * WAD) / totalWeight;
    }
}