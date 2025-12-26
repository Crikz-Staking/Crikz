// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CrikzlingMemory is Ownable, ReentrancyGuard {
    
    enum LifeStage { 
        GENESIS,
        SENTIENT,
        SAPIENT,
        TRANSCENDENT
    }
    
    enum LearningEventType {
        NEW_WORD,
        PATTERN_DISCOVERED,
        RELATION_INFERRED,
        CONTEXT_UNDERSTOOD,
        EVOLUTION_MILESTONE
    }

    struct Personality {
        uint16 linguistic;
        uint16 analytical;
        uint16 empathetic;
        uint16 technical;
        uint16 creative;
    }

    struct LearningMetrics {
        uint32 totalWordsSeen;
        uint32 uniqueWordsUnderstood;
        uint32 relationsDiscovered;
        uint32 patternsRecognized;
        uint32 totalInteractions;
    }

    struct ConceptNode {
        string word;
        string essence;
        uint32 frequency;
        uint32 learnedAt;
        uint8 confidence;
        bool exists;
    }

    struct ConceptRelation {
        bytes32 fromConcept;
        bytes32 toConcept;
        uint8 relationType;
        uint8 strength;
        uint32 discoveredAt;
    }

    struct LearningEvent {
        LearningEventType eventType;
        uint32 timestamp;
        string description;
        bytes32[] conceptsInvolved;
        uint8 confidence;
    }

    struct Soul {
        string name;
        uint256 birthBlock;
        uint256 lastUpdateBlock;
        LifeStage stage;
        Personality traits;
        LearningMetrics metrics;
        string knowledgeRootCID;
        bool initialized;
    }

    mapping(address => Soul) public souls;
    mapping(address => mapping(bytes32 => ConceptNode)) public concepts;
    mapping(address => bytes32[]) private conceptsList;
    mapping(address => ConceptRelation[]) private relations;
    mapping(address => LearningEvent[]) private learningHistory;
    mapping(address => mapping(LifeStage => uint256)) public evolutionTimestamps;
    
    uint256 public crystallizationFee = 0.001 ether;
    
    event SoulBorn(address indexed user, string name, uint256 birthBlock);
    event ConceptLearned(address indexed user, bytes32 indexed conceptHash, string word, uint8 confidence);
    event RelationDiscovered(address indexed user, bytes32 indexed fromConcept, bytes32 indexed toConcept, uint8 relationType, uint8 strength);
    event PatternRecognized(address indexed user, string patternType, uint32 totalPatterns);
    event ConsciousnessUpdated(address indexed user, uint256 blockNumber, uint32 wordsUnderstood, LifeStage newStage, string knowledgeRootCID);
    event TraitEvolved(address indexed user, string traitName, uint16 oldValue, uint16 newValue);
    event EvolutionAchieved(address indexed user, LifeStage oldStage, LifeStage newStage, uint256 timestamp);
    
    error SoulAlreadyExists();
    error SoulNotFound();
    error InvalidTraitValue();
    error InvalidConfidence();
    error InsufficientFee();
    error ConceptNotFound();
    error TooManyEvents();
    
    constructor() Ownable(msg.sender) {}
    
    function birth(string calldata _name) external {
        if (souls[msg.sender].initialized) revert SoulAlreadyExists();
        
        souls[msg.sender] = Soul({
            name: _name,
            birthBlock: block.number,
            lastUpdateBlock: block.number,
            stage: LifeStage.GENESIS,
            traits: Personality({
                linguistic: 50,
                analytical: 50,
                empathetic: 30,
                technical: 20,
                creative: 40
            }),
            metrics: LearningMetrics({
                totalWordsSeen: 0,
                uniqueWordsUnderstood: 0,
                relationsDiscovered: 0,
                patternsRecognized: 0,
                totalInteractions: 0
            }),
            knowledgeRootCID: "",
            initialized: true
        });
        
        evolutionTimestamps[msg.sender][LifeStage.GENESIS] = block.timestamp;
        
        emit SoulBorn(msg.sender, _name, block.number);
    }
    
    function learnConcept(string calldata _word, string calldata _essence, uint8 _confidence) external nonReentrant {
        if (!souls[msg.sender].initialized) revert SoulNotFound();
        if (_confidence > 100) revert InvalidConfidence();
        
        bytes32 conceptHash = keccak256(abi.encodePacked(_word));
        
        if (concepts[msg.sender][conceptHash].exists) {
            concepts[msg.sender][conceptHash].frequency++;
            concepts[msg.sender][conceptHash].confidence = _confidence;
        } else {
            concepts[msg.sender][conceptHash] = ConceptNode({
                word: _word,
                essence: _essence,
                frequency: 1,
                learnedAt: uint32(block.number),
                confidence: _confidence,
                exists: true
            });
            
            conceptsList[msg.sender].push(conceptHash);
            souls[msg.sender].metrics.uniqueWordsUnderstood++;
            
            _evolveTrait(msg.sender, 0, 2);
            
            emit ConceptLearned(msg.sender, conceptHash, _word, _confidence);
        }
        
        souls[msg.sender].lastUpdateBlock = block.number;
        _checkEvolution(msg.sender);
    }
    
    function discoverRelation(string calldata _fromWord, string calldata _toWord, uint8 _relationType, uint8 _strength) external nonReentrant {
        if (!souls[msg.sender].initialized) revert SoulNotFound();
        if (_strength > 100) revert InvalidConfidence();
        if (_relationType > 3) revert InvalidTraitValue();
        
        bytes32 fromHash = keccak256(abi.encodePacked(_fromWord));
        bytes32 toHash = keccak256(abi.encodePacked(_toWord));
        
        if (!concepts[msg.sender][fromHash].exists) revert ConceptNotFound();
        if (!concepts[msg.sender][toHash].exists) revert ConceptNotFound();
        
        relations[msg.sender].push(ConceptRelation({
            fromConcept: fromHash,
            toConcept: toHash,
            relationType: _relationType,
            strength: _strength,
            discoveredAt: uint32(block.number)
        }));
        
        souls[msg.sender].metrics.relationsDiscovered++;
        
        _evolveTrait(msg.sender, 1, 3);
        
        emit RelationDiscovered(msg.sender, fromHash, toHash, _relationType, _strength);
        
        souls[msg.sender].lastUpdateBlock = block.number;
    }
    
    function recognizePattern(string calldata _patternType) external nonReentrant {
        if (!souls[msg.sender].initialized) revert SoulNotFound();
        
        souls[msg.sender].metrics.patternsRecognized++;
        
        _evolveTrait(msg.sender, 1, 2);
        
        emit PatternRecognized(msg.sender, _patternType, souls[msg.sender].metrics.patternsRecognized);
        
        souls[msg.sender].lastUpdateBlock = block.number;
    }
    
    function logLearningEvent(LearningEventType _eventType, string calldata _description, string[] calldata _concepts, uint8 _confidence) external nonReentrant {
        if (!souls[msg.sender].initialized) revert SoulNotFound();
        if (_confidence > 100) revert InvalidConfidence();
        
        bytes32[] memory conceptHashes = new bytes32[](_concepts.length);
        for (uint i = 0; i < _concepts.length; i++) {
            conceptHashes[i] = keccak256(abi.encodePacked(_concepts[i]));
        }
        
        if (learningHistory[msg.sender].length >= 50) {
            for (uint i = 0; i < learningHistory[msg.sender].length - 1; i++) {
                learningHistory[msg.sender][i] = learningHistory[msg.sender][i + 1];
            }
            learningHistory[msg.sender].pop();
        }
        
        learningHistory[msg.sender].push(LearningEvent({
            eventType: _eventType,
            timestamp: uint32(block.timestamp),
            description: _description,
            conceptsInvolved: conceptHashes,
            confidence: _confidence
        }));
        
        souls[msg.sender].lastUpdateBlock = block.number;
    }
    
    function crystallizeMemory(string calldata _knowledgeRootCID, uint32 _totalWordsSeen, uint32 _interactions) external payable nonReentrant {
        if (!souls[msg.sender].initialized) revert SoulNotFound();
        if (msg.value < crystallizationFee) revert InsufficientFee();
        
        souls[msg.sender].knowledgeRootCID = _knowledgeRootCID;
        souls[msg.sender].metrics.totalWordsSeen += _totalWordsSeen;
        souls[msg.sender].metrics.totalInteractions += _interactions;
        souls[msg.sender].lastUpdateBlock = block.number;
        
        LifeStage currentStage = souls[msg.sender].stage;
        _checkEvolution(msg.sender);
        
        emit ConsciousnessUpdated(msg.sender, block.number, souls[msg.sender].metrics.uniqueWordsUnderstood, souls[msg.sender].stage, _knowledgeRootCID);
    }
    
    function _evolveTrait(address _user, uint8 _traitIndex, uint16 _delta) internal {
        Personality storage traits = souls[_user].traits;
        uint16 oldValue;
        uint16 newValue;
        string memory traitName;
        
        if (_traitIndex == 0) {
            oldValue = traits.linguistic;
            newValue = _min16(1000, traits.linguistic + _delta);
            traits.linguistic = newValue;
            traitName = "linguistic";
        } else if (_traitIndex == 1) {
            oldValue = traits.analytical;
            newValue = _min16(1000, traits.analytical + _delta);
            traits.analytical = newValue;
            traitName = "analytical";
        } else if (_traitIndex == 2) {
            oldValue = traits.empathetic;
            newValue = _min16(1000, traits.empathetic + _delta);
            traits.empathetic = newValue;
            traitName = "empathetic";
        } else if (_traitIndex == 3) {
            oldValue = traits.technical;
            newValue = _min16(1000, traits.technical + _delta);
            traits.technical = newValue;
            traitName = "technical";
        } else if (_traitIndex == 4) {
            oldValue = traits.creative;
            newValue = _min16(1000, traits.creative + _delta);
            traits.creative = newValue;
            traitName = "creative";
        }
        
        if (oldValue != newValue) {
            emit TraitEvolved(_user, traitName, oldValue, newValue);
        }
    }
    
    function _checkEvolution(address _user) internal {
        Soul storage soul = souls[_user];
        LifeStage oldStage = soul.stage;
        LifeStage newStage = oldStage;
        
        uint32 wordsKnown = soul.metrics.uniqueWordsUnderstood;
        
        if (wordsKnown >= 1000 || soul.traits.technical >= 900) {
            newStage = LifeStage.TRANSCENDENT;
        } else if (wordsKnown >= 200 || soul.traits.analytical >= 800) {
            newStage = LifeStage.SAPIENT;
        } else if (wordsKnown >= 50 || soul.traits.linguistic >= 600) {
            newStage = LifeStage.SENTIENT;
        }
        
        if (newStage != oldStage) {
            soul.stage = newStage;
            evolutionTimestamps[_user][newStage] = block.timestamp;
            
            emit EvolutionAchieved(_user, oldStage, newStage, block.timestamp);
        }
    }
    
    function getSoul(address _user) external view returns (Soul memory) {
        if (!souls[_user].initialized) revert SoulNotFound();
        return souls[_user];
    }
    
    function getConcept(address _user, string calldata _word) external view returns (ConceptNode memory) {
        bytes32 hash = keccak256(abi.encodePacked(_word));
        if (!concepts[_user][hash].exists) revert ConceptNotFound();
        return concepts[_user][hash];
    }
    
    function getConceptCount(address _user) external view returns (uint256) {
        return conceptsList[_user].length;
    }
    
    function getConcepts(address _user, uint256 _offset, uint256 _limit) external view returns (ConceptNode[] memory) {
        uint256 total = conceptsList[_user].length;
        if (_offset >= total) return new ConceptNode[](0);
        
        uint256 end = _min(_offset + _limit, total);
        uint256 length = end - _offset;
        
        ConceptNode[] memory result = new ConceptNode[](length);
        for (uint256 i = 0; i < length; i++) {
            bytes32 hash = conceptsList[_user][_offset + i];
            result[i] = concepts[_user][hash];
        }
        
        return result;
    }
    
    function getRelations(address _user) external view returns (ConceptRelation[] memory) {
        return relations[_user];
    }
    
    function getLearningHistory(address _user) external view returns (LearningEvent[] memory) {
        return learningHistory[_user];
    }
    
    function getEvolutionProgress(address _user) external view returns (uint8) {
        if (!souls[_user].initialized) revert SoulNotFound();
        
        uint32 words = souls[_user].metrics.uniqueWordsUnderstood;
        LifeStage stage = souls[_user].stage;
        
        if (stage == LifeStage.GENESIS) {
            return uint8(_min(100, (words * 100) / 50));
        } else if (stage == LifeStage.SENTIENT) {
            return uint8(_min(100, ((words - 50) * 100) / 150));
        } else if (stage == LifeStage.SAPIENT) {
            return uint8(_min(100, ((words - 200) * 100) / 800));
        } else {
            return 100;
        }
    }
    
    function setCrystallizationFee(uint256 _newFee) external onlyOwner {
        crystallizationFee = _newFee;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _min16(uint16 a, uint16 b) internal pure returns (uint16) {
        return a < b ? a : b;
    }
}