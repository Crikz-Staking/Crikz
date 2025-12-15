// contracts/libraries/RewardDistributor.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FIX: Change to reference file in the current directory
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
     * @dev This is the user's portion of the *global* accumulated reward up to this point.
     * @return newDebt The user's new reward debt.
     */
    function updateUserDebt(
        RewardPool memory pool,
        uint256 userWeight
    ) internal pure returns (uint256 newDebt) {
        // Debt = userWeight * accumulatedRewardPerWeight / WAD
        return (userWeight * pool.accumulatedRewardPerWeight) / CrikzMath.WAD;
    }

    /**
     * @notice Calculates the rewards pending for a user based on current pool state.
     * @return pendingRewards The amount of claimable tokens.
     */
    function calculatePending(
        RewardPool memory pool,
        uint256 userWeight,
        uint256 userDebt
    ) internal pure returns (uint256 pendingRewards) {
        // Accumulated rewards up to now = userWeight * accumulatedRewardPerWeight / WAD
        uint256 accumulated = (userWeight * pool.accumulatedRewardPerWeight) / CrikzMath.WAD;

        if (accumulated <= userDebt) {
            return 0;
        }
        return accumulated - userDebt;
    }

    /**
     * @notice Updates the RewardPool state by accruing time-based rewards.
     * @dev The rewards are calculated based on the time elapsed and a fixed BASE_APR_RATE.
     * The accrued rewards are immediately deducted from the pool balance and added to the 
     * accumulatedRewardPerWeight rate.
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
            pool.totalWeight // Not strictly needed for APR calculation but kept for future proofing
        );

        // Cap rewards at the pool's current balance
        if (rewardsAccrued > pool.balance) {
            rewardsAccrued = pool.balance;
        }
        
        if (rewardsAccrued > 0) {
            // Update the global accumulated reward per weight
            uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
                rewardsAccrued,
                pool.totalWeight
            );
            pool.accumulatedRewardPerWeight += rewardPerWeightDelta;
            
            // Deduct the accrued reward from the pool balance
            pool.balance -= rewardsAccrued;
        }
        
        pool.lastUpdateTime = currentTimestamp;
        return rewardsAccrued;
    }
}