// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol"; 
import "./StakingTiers.sol";

library StakeManager {
    using CrikzMath for uint256;

    struct StakeInfo {
        uint256 amount;
        uint8 tier;
        uint256 weight;
        uint256 lockUntil;
    }

    function createStake(
        uint256 amount,
        uint8 tier,
        StakingTiers.Tier memory tierInfo,
        uint256 timestamp
    ) internal pure returns (StakeInfo memory) {
        return StakeInfo({
            amount: amount,
            tier: tier,
            weight: CrikzMath.calculateWeight(amount, tierInfo.weightFactor),
            lockUntil: timestamp + tierInfo.lockDuration
        });
    }

    function isUnlocked(StakeInfo memory stake, uint256 timestamp) internal pure returns (bool) {
        return timestamp >= stake.lockUntil;
    }

    function getTimeRemaining(StakeInfo memory stake, uint256 timestamp) internal pure returns (uint256) {
        if (timestamp >= stake.lockUntil) {
            return 0;
        }
        return stake.lockUntil - timestamp;
    }

    /**
     * @notice Removes a stake from the array using a swap-and-pop technique.
     */
    function removeStake(StakeInfo[] storage stakes, uint256 index) internal {
        uint256 lastIndex = stakes.length - 1;
        if (index != lastIndex) {
            stakes[index] = stakes[lastIndex];
        }
        stakes.pop();
    }

    /**
     * @notice Updates the amount of an existing stake (used for compounding) and recalculates its weight.
     * @return oldWeight The weight before update
     * @return newWeight The weight after update
     */
    function updateStakeAmount(
        StakeInfo storage stake,
        uint256 newAmount,
        StakingTiers.Tier memory tierInfo
    ) internal returns (uint256 oldWeight, uint256 newWeight) {
        oldWeight = stake.weight;
        stake.amount = newAmount;
        newWeight = CrikzMath.calculateWeight(newAmount, tierInfo.weightFactor);
        stake.weight = newWeight;

        return (oldWeight, newWeight);
    }
}