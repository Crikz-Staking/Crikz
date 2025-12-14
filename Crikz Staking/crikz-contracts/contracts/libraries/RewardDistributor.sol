// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "C:/Users/Admin/Downloads/Crikz/Crikz-Staking/crikz-contracts/contracts/libraries/CrikzMath.sol";

library RewardDistributor {
    using CrikzMath for uint256;

    struct RewardPool {
        uint256 balance;
        uint256 accumulatedRewardPerWeight;
        uint256 lastUpdateTime;
        uint256 totalWeight;
    }

    function updatePool(
        RewardPool storage pool,
        uint256 currentTime
    ) internal returns (uint256 rewardsAccrued) {
        if (pool.totalWeight == 0 || pool.balance == 0) {
            pool.lastUpdateTime = currentTime;
            return 0;
        }

        if (currentTime <= pool.lastUpdateTime) {
            return 0;
        }

        uint256 timeElapsed = currentTime - pool.lastUpdateTime;

        rewardsAccrued = CrikzMath.calculateTimeBasedRewards(
            pool.balance,
            timeElapsed,
            pool.totalWeight
        );

        if (rewardsAccrued > pool.balance) {
            rewardsAccrued = pool.balance;
        }

        if (rewardsAccrued > 0) {
            uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
                rewardsAccrued,
                pool.totalWeight
            );

            pool.accumulatedRewardPerWeight += rewardPerWeightDelta;
        }

        pool.lastUpdateTime = currentTime;
        
        return rewardsAccrued;
    }

    function calculatePending(
        RewardPool storage pool,
        uint256 userWeight,
        uint256 userRewardDebt
    ) internal view returns (uint256) {
        if (userWeight == 0) return 0;
        
        uint256 accumulatedRewards = (userWeight * pool.accumulatedRewardPerWeight) / CrikzMath.WAD;
        
        if (accumulatedRewards <= userRewardDebt) return 0;
        
        return accumulatedRewards - userRewardDebt;
    }

    function updateUserDebt(
        RewardPool storage pool,
        uint256 userWeight
    ) internal view returns (uint256) {
        return (userWeight * pool.accumulatedRewardPerWeight) / CrikzMath.WAD;
    }

    function canWithdrawReward(
        RewardPool storage pool,
        uint256 amount
    ) internal view returns (bool) {
        return pool.balance >= amount;
    }
}