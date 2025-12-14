// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol";
import "./StakingTiers.sol";


library StakeManager {
    using CrikzMath for uint256;

    struct StakeInfo {
        uint256 amount;
        uint256 lockUntil;
        uint8 tier;
        uint256 weight;
    }

    function createStake(
        uint256 amount,
        uint8 tier,
        StakingTiers.Tier memory tierConfig,
        uint256 currentTime
    ) internal pure returns (StakeInfo memory) {
        require(amount > 0, "Stake amount must be positive");
        
        uint256 weight = CrikzMath.calculateWeight(amount, tierConfig.weightFactor);
        
        return StakeInfo({
            amount: amount,
            lockUntil: currentTime + tierConfig.lockDuration,
            tier: tier,
            weight: weight
        });
    }

    function isUnlocked(StakeInfo memory stake, uint256 currentTime) internal pure returns (bool) {
        return currentTime >= stake.lockUntil;
    }

    function removeStake(StakeInfo[] storage stakes, uint256 index) internal {
        require(index < stakes.length, "Index out of bounds");
        
        if (index != stakes.length - 1) {
            stakes[index] = stakes[stakes.length - 1];
        }
        stakes.pop();
    }

    function calculateTotalWeight(StakeInfo[] memory stakes) internal pure returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < stakes.length; i++) {
            totalWeight += stakes[i].weight;
        }
        return totalWeight;
    }

    function updateStakeAmount(
        StakeInfo storage stake,
        uint256 newAmount,
        StakingTiers.Tier memory tierConfig
    ) internal returns (uint256 oldWeight, uint256 newWeight) {
        require(newAmount > stake.amount, "Amount must increase");
        
        oldWeight = stake.weight;
        stake.amount = newAmount;
        newWeight = CrikzMath.calculateWeight(newAmount, tierConfig.weightFactor);
        stake.weight = newWeight;
    }

    function getTimeRemaining(StakeInfo memory stake, uint256 currentTime) internal pure returns (uint256) {
        if (currentTime >= stake.lockUntil) return 0;
        return stake.lockUntil - currentTime;
    }
}