// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CrikzMath.sol"; 
import "./WorkTiers.sol";

library JobManager {
    using CrikzMath for uint256;

    error InvalidJobIndex();
    error JobStillLocked();

    struct Job {
        uint256 amount;
        uint8 tier;
        uint256 reputation;
        uint256 lockUntil;
        uint256 startTime;
    }

    function createJob(
        uint256 amount,
        uint8 tier,
        WorkTiers.Tier memory tierInfo,
        uint256 timestamp
    ) internal pure returns (Job memory) {
        return Job({
            amount: amount,
            tier: tier,
            reputation: CrikzMath.calculateReputation(amount, tierInfo.reputationMultiplier),
            lockUntil: timestamp + tierInfo.lockDuration,
            startTime: timestamp
        });
    }

    function isCompleted(Job memory job, uint256 timestamp) internal pure returns (bool) {
        return timestamp >= job.lockUntil;
    }

    function validateCompleted(Job memory job, uint256 timestamp) internal pure {
        if (!isCompleted(job, timestamp)) revert JobStillLocked();
    }

    function getTimeRemaining(Job memory job, uint256 timestamp) internal pure returns (uint256) {
        if (timestamp >= job.lockUntil) return 0;
        return job.lockUntil - timestamp;
    }

    function removeJob(Job[] storage jobs, uint256 index) internal {
        if (index >= jobs.length) revert InvalidJobIndex();
        uint256 lastIndex = jobs.length - 1;
        if (index != lastIndex) {
            jobs[index] = jobs[lastIndex];
        }
        jobs.pop();
    }

    function updateJobAmount(
        Job storage job,
        uint256 newAmount,
        WorkTiers.Tier memory tierInfo
    ) internal returns (uint256 oldReputation, uint256 newReputation) {
        oldReputation = job.reputation;
        job.amount = newAmount;
        newReputation = CrikzMath.calculateReputation(newAmount, tierInfo.reputationMultiplier);
        job.reputation = newReputation;
        return (oldReputation, newReputation);
    }

    function validateJobIndex(Job[] storage jobs, uint256 index) internal view {
        if (index >= jobs.length) revert InvalidJobIndex();
    }
}