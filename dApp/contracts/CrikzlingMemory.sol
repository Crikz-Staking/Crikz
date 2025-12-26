// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CrikzlingMemory is Ownable {
    struct MemorySnapshot {
        uint256 timestamp;
        string ipfsCid;      // The JSON export of the brain
        uint256 conceptsCount;
        string triggerEvent; // e.g., "OWNER_SAVE", "USER_INTERACTION"
    }

    MemorySnapshot[] public memoryTimeline;
    mapping(address => bool) public authorizedTrainers;

    event MemoryCrystallized(uint256 indexed snapshotId, string ipfsCid, uint256 conceptsCount);
    
    constructor() Ownable(msg.sender) {
        authorizedTrainers[msg.sender] = true;
    }

    // Save current brain state to chain
    function crystallizeMemory(string calldata _ipfsCid, uint256 _conceptsCount, string calldata _trigger) external {
        memoryTimeline.push(MemorySnapshot({
            timestamp: block.timestamp,
            ipfsCid: _ipfsCid,
            conceptsCount: _conceptsCount,
            triggerEvent: _trigger
        }));
        emit MemoryCrystallized(memoryTimeline.length - 1, _ipfsCid, _conceptsCount);
    }

    // View latest memory
    function getLatestMemory() external view returns (MemorySnapshot memory) {
        require(memoryTimeline.length > 0, "No memory exists");
        return memoryTimeline[memoryTimeline.length - 1];
    }
}