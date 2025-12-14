// contracts/libraries/StakeManager.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FIX: Change to reference files in the current directory
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
     * @notice Removes a stake from the array using a swap-and-pop technique for gas efficiency.
     */
    function removeStake(StakeInfo[] storage stakes, uint256 index) internal {
        uint256 lastIndex = stakes.length - 1;
        
        if (index != lastIndex) {
            // Overwrite the stake to be removed with the last stake
            stakes[index] = stakes[lastIndex];
            // Note: If you need to track the moved index in an event, you would emit it here.
        }
        // Remove the last element (which is now either the original last or the moved element)
        stakes.pop();
    }

    /**
     * @notice Updates the amount of an existing stake and recalculates its weight.
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
        // The calling function (compoundRewards) handles the global weight update.
    }
}