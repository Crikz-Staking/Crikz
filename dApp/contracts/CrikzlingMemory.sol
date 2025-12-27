// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CrikzlingMemory is Ownable {
    struct MemorySnapshot {
        uint256 timestamp;
        string ipfsCid;
        uint256 conceptsCount;
        string evolutionStage;
        string triggerEvent;
    }

    MemorySnapshot[] public memoryTimeline;
    mapping(address => bool) public authorizedTrainers;

    event MemoryCrystallized(uint256 indexed snapshotId, string ipfsCid, string evolutionStage);

    constructor() Ownable(msg.sender) {
        authorizedTrainers[msg.sender] = true;
    }

    function crystallizeMemory(
        string calldata _ipfsCid, 
        uint256 _conceptsCount, 
        string calldata _evolutionStage,
        string calldata _trigger
    ) external {
        memoryTimeline.push(MemorySnapshot({
            timestamp: block.timestamp,
            ipfsCid: _ipfsCid,
            conceptsCount: _conceptsCount,
            evolutionStage: _evolutionStage,
            triggerEvent: _trigger
        }));
        emit MemoryCrystallized(memoryTimeline.length - 1, _ipfsCid, _evolutionStage);
    }

    function getLatestMemory() external view returns (MemorySnapshot memory) {
        require(memoryTimeline.length > 0, "No memory exists");
        return memoryTimeline[memoryTimeline.length - 1];
    }
}