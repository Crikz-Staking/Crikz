// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol"; 
import "./WorkTiers.sol";

library WorkManager {
    using CrikzMath for uint256;

    error InvalidWorkIndex();
    error WorkContractLocked();

    struct WorkPosition {
        uint256 amount;
        uint8 tier;
        uint256 reputation;
        uint256 lockUntil;
    }

    function createWorkPosition(
        uint256 amount,
        uint8 tier,
        WorkTiers.Tier memory tierInfo,
        uint256 timestamp
    ) internal pure returns (WorkPosition memory) {
        return WorkPosition({
            amount: amount,
            tier: tier,
            reputation: CrikzMath.calculateReputation(amount, tierInfo.reputationFactor),
            lockUntil: timestamp + tierInfo.lockDuration
        });
    }

    function isUnlocked(WorkPosition memory position, uint256 timestamp) internal pure returns (bool) {
        return timestamp >= position.lockUntil;
    }

    function validateUnlocked(WorkPosition memory position, uint256 timestamp) internal pure {
        if (!isUnlocked(position, timestamp)) revert WorkContractLocked();
    }

    function getTimeRemaining(WorkPosition memory position, uint256 timestamp) internal pure returns (uint256) {
        if (timestamp >= position.lockUntil) return 0;
        return position.lockUntil - timestamp;
    }

    function removeWorkPosition(WorkPosition[] storage positions, uint256 index) internal {
        if (index >= positions.length) revert InvalidWorkIndex();
        uint256 lastIndex = positions.length - 1;
        if (index != lastIndex) {
            positions[index] = positions[lastIndex];
        }
        positions.pop();
    }

    function updateWorkAmount(
        WorkPosition storage position,
        uint256 newAmount,
        WorkTiers.Tier memory tierInfo
    ) internal returns (uint256 oldReputation, uint256 newReputation) {
        oldReputation = position.reputation;
        position.amount = newAmount;
        newReputation = CrikzMath.calculateReputation(newAmount, tierInfo.reputationFactor);
        position.reputation = newReputation;
        return (oldReputation, newReputation);
    }

    function validateWorkIndex(WorkPosition[] storage positions, uint256 index) internal view {
        if (index >= positions.length) revert InvalidWorkIndex();
    }
}