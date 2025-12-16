// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./libraries/CrikzMath.sol"; 
import "./libraries/WorkTiers.sol";
import "./libraries/WorkManager.sol";
import "./libraries/WageDistributor.sol";

contract Crikz is ERC20, ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using CrikzMath for uint256;
    using WorkManager for WorkManager.WorkPosition[];

    address public immutable PANCAKESWAP_V2_ROUTER;
    address public lpPairAddress;
    
    WorkTiers.Tier[] public workTiers;
    WageDistributor.WagePool public workPool;
    
    mapping(address => WorkManager.WorkPosition[]) public workPositions;
    mapping(address => uint256) public userWageDebt;
    mapping(address => uint256) public userTotalReputation;
    mapping(address => bool) private hasActiveWork;
    mapping(address => uint256) public userTotalWagesClaimed;
    mapping(address => uint256) public userTotalCompounded;

    uint256 public constant INITIAL_POOL_ALLOCATION = 410_414_531 * 10**18; 
    uint256 public constant MAX_WORK_POSITIONS = 50;
    
    uint256 public totalWorkingAmount;
    uint256 public totalWorkers;
    uint256 public totalWagesClaimed;
    uint256 public totalWagesCompounded;

    error InsufficientBalance();
    error LPPairAlreadySet();
    error InvalidAddress();
    error AmountTooSmall();
    error MaxPositionsReached();
    error ExceedsWorkPool();

    event WorkStarted(address indexed user, uint256 amount, uint8 tier, uint256 reputation, uint256 lockUntil, uint256 index, uint256 timestamp);
    event WorkEnded(address indexed user, uint256 index, uint256 amount, uint256 reputation, uint256 timestamp);
    event EmergencyWorkEnded(address indexed user, uint256 index, uint256 principal, uint256 penaltyToPool, uint256 returnedToUser, uint256 timestamp);
    event WagesClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event WagesCompounded(address indexed user, uint256 indexed index, uint256 wageAmount, uint256 newTotalAmount, uint256 timestamp);
    event WorkPoolFunded(address indexed funder, uint256 amount, uint256 newBalance, uint256 timestamp);
    event TaxToWorkPool(address indexed from, uint256 taxAmount, uint256 timestamp);
    event LPPairSet(address indexed lpPair, uint256 timestamp);
    event EmergencyWithdraw(address indexed owner, uint256 amount, uint256 newPoolBalance, uint256 timestamp);
    event PoolReputationChanged(uint256 oldTotalReputation, uint256 newTotalReputation, uint256 changeAmount, bool isIncrease, uint256 timestamp);

    constructor(address trustedForwarder, address pancakeswapRouter)
        ERC20("Crikz", "CRIKZ")
        ERC2771Context(trustedForwarder) 
        Ownable() 
    {
        if (pancakeswapRouter == address(0)) revert InvalidAddress();
        PANCAKESWAP_V2_ROUTER = pancakeswapRouter;

        WorkTiers.Tier[] memory tiers = WorkTiers.initializeTiers();
        for (uint8 i = 0; i < tiers.length; i++) {
            workTiers.push(tiers[i]);
        }

        uint256 totalToMint = 701_408_733 * 10**decimals();
        _mint(address(this), totalToMint); 
        
        workPool.balance = INITIAL_POOL_ALLOCATION;
        workPool.lastUpdateTime = block.timestamp;
        
        uint256 amountToOwner = totalToMint - INITIAL_POOL_ALLOCATION;
        _transfer(address(this), _msgSender(), amountToOwner);
    }

    function getWorkPoolBalance() public view returns (uint256) {
        return workPool.balance;
    }

    function getWorkPoolTotalReputation() public view returns (uint256) {
        return workPool.totalReputation;
    }

    function getEffectiveAPR() public pure returns (uint256) {
        return CrikzMath.getEffectiveAPR();
    }

    function _contextSuffixLength() internal view virtual override(ERC2771Context, Context) returns (uint256) {
        return super._contextSuffixLength();
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
    
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        
        if (from == address(0) || to == address(0) || from == owner() || to == owner() || from == address(this)) {
            super._transfer(from, to, amount);
            return; 
        }

        bool isDEXTrade = _isDEXTransaction(from, to);

        if (isDEXTrade) {
            uint256 taxAmount = CrikzMath.calculateTaxFee(amount);
            uint256 netAmount = amount - taxAmount;

            if (taxAmount > 0) {
                super._transfer(from, address(this), taxAmount);
                workPool.balance += taxAmount;
                emit TaxToWorkPool(from, taxAmount, block.timestamp);
            }

            if (netAmount > 0) {
                super._transfer(from, to, netAmount);
            }
        } else {
            super._transfer(from, to, amount);
        }
    }

    function _isDEXTransaction(address from, address to) private view returns (bool) {
        return (from == PANCAKESWAP_V2_ROUTER || to == PANCAKESWAP_V2_ROUTER || from == lpPairAddress || to == lpPairAddress);
    }

    function setLPPairAddress(address _lpPairAddress) external onlyOwner {
        if (lpPairAddress != address(0)) revert LPPairAlreadySet();
        if (_lpPairAddress == address(0)) revert InvalidAddress();
        
        lpPairAddress = _lpPairAddress;
        emit LPPairSet(_lpPairAddress, block.timestamp);
    }

    function fundWorkPool(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        
        _transfer(_msgSender(), address(this), amount);
        workPool.balance += amount;
        emit WorkPoolFunded(_msgSender(), amount, workPool.balance, block.timestamp);
    }

    function emergencyOwnerWithdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        if (balanceOf(address(this)) < amount) revert InsufficientBalance();
        if (workPool.balance < amount) revert ExceedsWorkPool();

        workPool.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        emit EmergencyWithdraw(_msgSender(), amount, workPool.balance, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _updatePool() internal {
        WageDistributor.updatePool(workPool, block.timestamp);
    }

    function _updateUserDebt(address user) internal {
        uint256 newDebt = WageDistributor.updateUserDebt(workPool, userTotalReputation[user]);
        userWageDebt[user] = newDebt;
    }
    
    function _updatePoolReputation(uint256 oldReputation, uint256 newReputation) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease ? newReputation - oldReputation : oldReputation - newReputation;
        workPool.totalReputation = isIncrease ? workPool.totalReputation + changeAmount : workPool.totalReputation - changeAmount;
        emit PoolReputationChanged(oldReputation, workPool.totalReputation, changeAmount, isIncrease, block.timestamp);
    }

    function _updateUserReputation(address user, uint256 oldReputation, uint256 newReputation) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease ? newReputation - oldReputation : oldReputation - newReputation;
        userTotalReputation[user] = isIncrease ? userTotalReputation[user] + changeAmount : userTotalReputation[user] - changeAmount;
    }
    
    function pendingWages(address account) public view returns (uint256) {
        if (userTotalReputation[account] == 0) return 0;
        WageDistributor.WagePool memory poolSnapshot = workPool;
        
        if (poolSnapshot.totalReputation == 0 || poolSnapshot.balance == 0) return 0;

        if (block.timestamp > poolSnapshot.lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - poolSnapshot.lastUpdateTime;
            uint256 wagesAccrued = CrikzMath.calculateTimeBasedWages(poolSnapshot.balance, timeElapsed, poolSnapshot.totalReputation);
            if (wagesAccrued > poolSnapshot.balance) wagesAccrued = poolSnapshot.balance;
            
            if (wagesAccrued > 0) {
                uint256 wagePerReputationDelta = CrikzMath.calculateWagePerReputation(wagesAccrued, poolSnapshot.totalReputation);
                poolSnapshot.accumulatedWagePerReputation += wagePerReputationDelta;
            }
        }

        uint256 accumulatedWages = (userTotalReputation[account] * poolSnapshot.accumulatedWagePerReputation) / CrikzMath.WAD;
        
        if (accumulatedWages <= userWageDebt[account]) return 0;
        return accumulatedWages - userWageDebt[account];
    }

    function startWork(uint256 amount, uint8 tier) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        if (amount < CrikzMath.MIN_WORK_AMOUNT) revert AmountTooSmall();
        WorkTiers.validateTier(tier);
        if (balanceOf(worker) < amount) revert InsufficientBalance();
        if (workPositions[worker].length >= MAX_WORK_POSITIONS) revert MaxPositionsReached();

        _updatePool();
        _updateUserDebt(worker); 

        _transfer(worker, address(this), amount);
        
        WorkManager.WorkPosition memory newPosition = WorkManager.createWorkPosition(amount, tier, workTiers[tier], block.timestamp);
        
        uint256 oldPoolReputation = workPool.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];

        _updatePoolReputation(oldPoolReputation, oldPoolReputation + newPosition.reputation);
        _updateUserReputation(worker, oldUserReputation, oldUserReputation + newPosition.reputation);
        
        totalWorkingAmount += amount;
        
        uint256 index = workPositions[worker].length;
        workPositions[worker].push(newPosition);
        
        if (!hasActiveWork[worker]) {
            hasActiveWork[worker] = true;
            totalWorkers += 1;
        }

        _updateUserDebt(worker);
        emit WorkStarted(worker, amount, tier, newPosition.reputation, newPosition.lockUntil, index, block.timestamp);
    }

    function endWork(uint256 index) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        WorkManager.validateWorkIndex(workPositions[worker], index);
        WorkManager.WorkPosition memory position = workPositions[worker][index];
        WorkManager.validateUnlocked(position, block.timestamp);

        _updatePool();
        _claimWages(worker);

        uint256 oldPoolReputation = workPool.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];
        uint256 reputationToSubtract = position.reputation;
        uint256 amount = position.amount;

        _updatePoolReputation(oldPoolReputation, oldPoolReputation - reputationToSubtract);
        _updateUserReputation(worker, oldUserReputation, oldUserReputation - reputationToSubtract);
        
        totalWorkingAmount -= amount;
        workPositions[worker].removeWorkPosition(index);

        if (workPositions[worker].length == 0) {
            hasActiveWork[worker] = false;
            totalWorkers -= 1;
        }
        
        _transfer(address(this), worker, amount);
        _updateUserDebt(worker);

        emit WorkEnded(worker, index, amount, reputationToSubtract, block.timestamp);
    }

    function emergencyEndWork(uint256 index) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        WorkManager.validateWorkIndex(workPositions[worker], index);
        WorkManager.WorkPosition memory position = workPositions[worker][index];

        _updatePool();
        _updateUserDebt(worker);

        uint256 oldPoolReputation = workPool.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];
        uint256 reputation = position.reputation;
        uint256 principal = position.amount;

        uint256 penaltyFee = CrikzMath.calculateTaxFee(principal);
        uint256 toUser = principal - penaltyFee;

        if(penaltyFee > 0) {
            workPool.balance += penaltyFee;
        }
        
        _updatePoolReputation(oldPoolReputation, oldPoolReputation - reputation);
        _updateUserReputation(worker, oldUserReputation, oldUserReputation - reputation);
        totalWorkingAmount -= principal;

        workPositions[worker].removeWorkPosition(index);
        
        if (workPositions[worker].length == 0) {
            hasActiveWork[worker] = false;
            totalWorkers -= 1;
        }

        _transfer(address(this), worker, toUser);
        _updateUserDebt(worker);
        
        emit EmergencyWorkEnded(worker, index, principal, penaltyFee, toUser, block.timestamp);
    }

    function _claimWages(address worker) internal {
        _updatePool();
        uint256 pendingAmount = pendingWages(worker);
        
        if (pendingAmount > 0) {
            WageDistributor.validateSufficientBalance(workPool, pendingAmount);
            workPool.balance -= pendingAmount;
            totalWagesClaimed += pendingAmount;
            userTotalWagesClaimed[worker] += pendingAmount;
            
            _updateUserDebt(worker);

            _transfer(address(this), worker, pendingAmount);
            emit WagesClaimed(worker, pendingAmount, block.timestamp);
        } else {
            _updateUserDebt(worker);
        }
    }

    function claimWages() external nonReentrant whenNotPaused {
        _claimWages(_msgSender());
    }

    function claimAllWages() external nonReentrant whenNotPaused {
        address worker = _msgSender();
        _updatePool();
        uint256 totalPending = pendingWages(worker);
        
        WageDistributor.validatePendingWages(totalPending);
        WageDistributor.validateSufficientBalance(workPool, totalPending);

        workPool.balance -= totalPending;
        totalWagesClaimed += totalPending;
        userTotalWagesClaimed[worker] += totalPending;
        
        _updateUserDebt(worker);

        _transfer(address(this), worker, totalPending);
        emit WagesClaimed(worker, totalPending, block.timestamp);
    }

    function compoundWages(uint256 index) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        WorkManager.validateWorkIndex(workPositions[worker], index);
        _updatePool();
        uint256 pendingAmount = pendingWages(worker);
        WageDistributor.validatePendingWages(pendingAmount);
        WageDistributor.validateSufficientBalance(workPool, pendingAmount);

        _executeCompounding(worker, index, pendingAmount);
    }

    function _executeCompounding(address worker, uint256 index, uint256 pendingAmount) internal {
        WorkManager.WorkPosition storage position = workPositions[worker][index];
        uint256 oldPoolReputation = workPool.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];

        workPool.balance -= pendingAmount;
        totalWagesCompounded += pendingAmount;
        userTotalCompounded[worker] += pendingAmount;
        totalWorkingAmount += pendingAmount;
        
        WorkTiers.Tier memory tierInfo = workTiers[position.tier];
        (uint256 oldReputationBeforeUpdate, uint256 newReputation) = WorkManager.updateWorkAmount(position, position.amount + pendingAmount, tierInfo);
        
        uint256 reputationChange = newReputation - oldReputationBeforeUpdate;
        
        _updatePoolReputation(oldPoolReputation, oldPoolReputation + reputationChange);
        _updateUserReputation(worker, oldUserReputation, oldUserReputation + reputationChange);

        _updateUserDebt(worker);
        emit WagesCompounded(worker, index, pendingAmount, position.amount, block.timestamp);
    }

    function getTierDetails(uint8 tier) external view returns (uint256 lockDuration, uint256 reputationFactor) {
        WorkTiers.validateTier(tier);
        return (workTiers[tier].lockDuration, workTiers[tier].reputationFactor);
    }
    
    function getWorkCount(address account) external view returns (uint256) {
        return workPositions[account].length;
    }

    function getWorkByIndex(address account, uint256 index) external view returns (WorkManager.WorkPosition memory) {
        WorkManager.validateWorkIndex(workPositions[account], index);
        return workPositions[account][index];
    }

    function getContractStats() external view returns (
        uint256 _totalWorking, 
        uint256 _totalWorkers, 
        uint256 _poolBalance, 
        uint256 _poolTotalReputation, 
        uint256 _totalClaimed, 
        uint256 _totalCompounded
    ) {
        return (
            totalWorkingAmount, 
            totalWorkers, 
            workPool.balance, 
            workPool.totalReputation, 
            totalWagesClaimed, 
            totalWagesCompounded
        );
    }

    function getUserStats(address account) external view returns (
        uint256 _totalReputation, 
        uint256 _wageDebt, 
        uint256 _pendingWages, 
        uint256 _activeContracts, 
        uint256 _totalClaimed, 
        uint256 _totalCompounded
    ) {
        return (
            userTotalReputation[account], 
            userWageDebt[account], 
            pendingWages(account), 
            workPositions[account].length, 
            userTotalWagesClaimed[account], 
            userTotalCompounded[account]
        );
    }
}