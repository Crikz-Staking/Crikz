// contracts/libraries/CrikzMath.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library CrikzMath {
    // Standard 18 decimal precision unit
    uint256 public constant WAD = 1e18; 
    
    // Fee parameters (1.618% Fee)
    uint256 private constant BURN_FEE_NUMERATOR = 1618;
    uint256 private constant FEE_DENOMINATOR = 100000;
    
    // Reward parameters
    uint256 public constant BASE_APR_RATE = 618 * 10**15; // 0.0618 * 1e18 (6.18%)
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_STAKE_AMOUNT = 1 * WAD; // Minimum stake of 1 token

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
     * @dev Simple distribution: rewards = poolBalance * (BASE_APR_RATE / WAD) * (timeElapsed / SECONDS_PER_YEAR)
     * Since rewards are distributed pro-rata based on weight, this is a simplified calculation.
     * The actual reward calculation happens via `accumulatedRewardPerWeight` in the main contract logic.
     * This function is used primarily for reward projection and pool update simulation.
     */
    function calculateTimeBasedRewards(
        uint256 poolBalance, 
        uint256 timeElapsed, 
        uint256 totalWeight
    ) internal pure returns (uint256 rewardsAccrued) {
        // If there's no weight, the rate is effectively 0, preventing division by zero risk in rewardPerWeight calculation later.
        if (totalWeight == 0) return 0;

        // Rewards accrue based on the pool's *balance*, not total weight.
        // We use BASE_APR_RATE to model a constant drip.
        // rewards = poolBalance * BASE_APR_RATE * timeElapsed / SECONDS_PER_YEAR / WAD
        
        // Use a safe multiplication order to prevent overflow and maintain precision.
        rewardsAccrued = (poolBalance * BASE_APR_RATE) / WAD;
        rewardsAccrued = (rewardsAccrued * timeElapsed) / SECONDS_PER_YEAR;

        return rewardsAccrued;
    }

    /**
     * @notice Calculates the change in accumulated reward per weight.
     * @dev This value is added to the RewardPool.accumulatedRewardPerWeight.
     */
    function calculateRewardPerWeight(uint256 rewardsAccrued, uint256 totalWeight) internal pure returns (uint256) {
        if (rewardsAccrued == 0 || totalWeight == 0) return 0;
        // rewardPerWeight = (rewardsAccrued * WAD) / totalWeight
        return (rewardsAccrued * WAD) / totalWeight;
    }
}