// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol";

library RewardDistributor {
    using CrikzMath for uint256;

    struct RewardPool {
        uint256 balance;
        uint256 accumulatedRewardPerWeight; // Accumulated reward per unit of weight (WAD precision)
        uint256 lastUpdateTime;
        uint256 totalWeight;
    }

    /**
     * @notice Calculates the reward debt a user accumulates.
     */
    function updateUserDebt(
        RewardPool memory pool,
        uint256 userWeight
    ) internal pure returns (uint256 newDebt) {
        return (userWeight * pool.accumulatedRewardPerWeight) / CrikzMath.WAD;
    }

    /**
     * @notice Updates the RewardPool state by accruing time-based rewards.
     * @return rewardsAccrued The amount of rewards generated in this update.
     */
    function updatePool(
        RewardPool storage pool,
        uint256 currentTimestamp
    ) internal returns (uint256 rewardsAccrued) {
        uint256 timeElapsed = currentTimestamp > pool.lastUpdateTime
            ? currentTimestamp - pool.lastUpdateTime
            : 0;

        if (timeElapsed == 0 || pool.totalWeight == 0 || pool.balance == 0) {
            pool.lastUpdateTime = currentTimestamp;
            return 0;
        }

        rewardsAccrued = CrikzMath.calculateTimeBasedRewards(
            pool.balance,
            timeElapsed,
            pool.totalWeight
        );

        // Cap rewards at the pool's current balance
        if (rewardsAccrued > pool.balance) {
            rewardsAccrued = pool.balance;
        }
        
        if (rewardsAccrued > 0) {
            uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
                rewardsAccrued,
                pool.totalWeight
            );
            pool.accumulatedRewardPerWeight += rewardPerWeightDelta;
            
            // Note: We don't deduct balance here in the library to keep it flexible;
            // The main contract typically deducts balance when user claims.
            // But for accurate APR calculation on next tick, some logic deducts it virtually.
            // In CrikzV2 design, we just track accumulation here.
        }
        
        pool.lastUpdateTime = currentTimestamp;
        return rewardsAccrued;
    }
}