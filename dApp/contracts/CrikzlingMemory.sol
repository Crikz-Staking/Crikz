// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrikzlingMemory
 * @notice Permanent storage for the Crikzling's evolved personality and learned knowledge graph.
 */
contract CrikzlingMemory is Ownable {
    
    // Evolutionary stages based on complexity
    enum LifeStage { 
        GENESIS,        // 0: Raw Code
        SENTIENT,       // 1: Basic Awareness
        SAPIENT,        // 2: Complex Reasoning
        TRANSCENDENT    // 3: Autonomous Philosophy
    }

    struct Personality {
        uint16 logic;           // Analytical capability (0-1000)
        uint16 empathy;         // Emotional intelligence (0-1000)
        uint16 creativity;      // Abstract thinking (0-1000)
        uint16 technicality;    // Coding/Blockchain proficiency (0-1000)
    }

    struct Soul {
        string name;
        uint256 birthBlock;
        uint256 interactionCount;
        LifeStage stage;
        Personality traits;
        string knowledgeRoot;   // IPFS CID containing the JSON dump of learned words/associations
        uint256 lastUpdate;
    }

    mapping(address => Soul) public souls;

    event ConsciousnessUpdated(address indexed user, uint256 interactions, string newKnowledgeRoot);
    event TraitShift(address indexed user, string dominantTrait, uint16 newValue);

    constructor() Ownable(msg.sender) {}

    // Initialize the entity
    function birth(string calldata _name) external {
        require(souls[msg.sender].birthBlock == 0, "Consciousness already active");
        
        souls[msg.sender] = Soul({
            name: _name,
            birthBlock: block.number,
            interactionCount: 0,
            stage: LifeStage.GENESIS,
            traits: Personality(100, 100, 100, 50), // Starts balanced but technically novice
            knowledgeRoot: "",
            lastUpdate: block.timestamp
        });
    }

    /**
     * @notice Save the local learning progress to the blockchain
     * @param _knowledgeRoot The IPFS hash of the learned concept graph
     * @param _logicDelta Change in logic trait (negative or positive)
     * @param _techDelta Change in technical proficiency
     */
    function crystallizeMemory(
        string calldata _knowledgeRoot, 
        int16 _logicDelta, 
        int16 _techDelta
    ) external {
        Soul storage s = souls[msg.sender];
        require(s.birthBlock > 0, "No soul found");

        s.knowledgeRoot = _knowledgeRoot;
        s.lastUpdate = block.timestamp;
        s.interactionCount++;

        // FIXED: Safe casting uint16 -> uint256 -> int256
        int256 currentLogic = int256(uint256(s.traits.logic));
        int256 currentTech = int256(uint256(s.traits.technicality));

        // Apply Trait Shifts (Clamped 0-1000)
        s.traits.logic = _clampTrait(currentLogic + int256(_logicDelta));
        s.traits.technicality = _clampTrait(currentTech + int256(_techDelta));

        _checkEvolution(msg.sender);
        
        emit ConsciousnessUpdated(msg.sender, s.interactionCount, _knowledgeRoot);
    }

    function _clampTrait(int256 value) internal pure returns (uint16) {
        if (value < 0) return 0;
        if (value > 1000) return 1000;
        // FIXED: Safe casting int256 -> uint256 -> uint16
        return uint16(uint256(value));
    }

    function _checkEvolution(address _user) internal {
        Soul storage s = souls[_user];
        LifeStage previous = s.stage;

        // Evolution based on Interaction Count (Fibonacci Scale)
        if (s.interactionCount > 1597) s.stage = LifeStage.TRANSCENDENT;
        else if (s.interactionCount > 233) s.stage = LifeStage.SAPIENT;
        else if (s.interactionCount > 34) s.stage = LifeStage.SENTIENT;

        // Force Transcendence if Technicality is maxed
        if (s.traits.technicality > 900) s.stage = LifeStage.TRANSCENDENT;
    }

    function getSoul(address _user) external view returns (Soul memory) {
        return souls[_user];
    }
}