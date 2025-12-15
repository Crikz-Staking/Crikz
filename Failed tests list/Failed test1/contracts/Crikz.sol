// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
// Ensure these imported files exist and are correct
import "contracts/libraries/CrikzMath.sol"; 
import "contracts/libraries/StakingTiers.sol";
import "contracts/libraries/StakeManager.sol";
import "contracts/libraries/RewardDistributor.sol";

contract Crikz is ERC20, Ownable, ReentrancyGuard, ERC2771Context {
    using CrikzMath for uint256;
    using StakeManager for StakeManager.StakeInfo[];

    // --- CONFIGURATION AND STATE ---
    address public immutable PANCAKESWAP_V2_ROUTER;
    address public lpPairAddress;
    
    StakingTiers.Tier[] public stakingTiers;
    RewardDistributor.RewardPool public rewardPool;
    
    mapping(address => StakeManager.StakeInfo[]) public stakes;
    mapping(address => uint256) public userRewardDebt;
    mapping(address => uint256) public userTotalWeight;

    uint256 public constant MAX_REWARD_POOL = 500_000 * 10**18;
    uint256 public totalStaked;
    uint256 public totalStakers;
    uint256 public totalBurned;
    uint256 public totalRewardsClaimed;
    uint256 public totalRewardsCompounded;
    
    mapping(address => bool) private hasStakes;
    mapping(address => uint256) public userTotalRewardsClaimed;
    mapping(address => uint256) public userTotalCompounded;

    // --- EVENTS (Kept Verbose as per your last version) ---
    event Staked(
        address indexed user,
        uint256 amount,
        uint8 tier,
        uint256 weight,
        uint256 lockUntil,
        uint256 stakeIndex,
        uint256 timestamp,
        uint256 totalStakedAfter,
        uint256 totalWeightAfter
    );
    
    event Unstaked(
        address indexed user,
        uint256 stakeIndex,
        uint256 amount,
        uint256 weight,
        uint256 timestamp,
        uint256 totalStakedAfter,
        uint256 totalWeightAfter
    );
    
    event EmergencyUnstaked(
        address indexed user,
        uint256 stakeIndex,
        uint256 principal,
        uint256 burnPenalty,
        uint256 returned,
        uint256 timestamp,
        uint256 totalBurnedAfter
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 rewardAmount,
        uint256 timestamp,
        uint256 userTotalClaimedAfter,
        uint256 rewardPoolBalanceAfter
    );
    
    event RewardsCompounded(
        address indexed user,
        uint256 stakeIndex,
        uint256 rewardAmount,
        uint256 oldStakeAmount,
        uint256 newStakeAmount,
        uint256 oldWeight,
        uint256 newWeight,
        uint256 timestamp,
        uint256 userTotalCompoundedAfter,
        uint256 totalStakedAfter,
        uint256 totalWeightAfter,
        uint256 rewardPoolBalanceAfter
    );
    
    event RewardPoolFunded(
        address indexed funder,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    
    event RewardPoolUpdated(
        uint256 timeElapsed,
        uint256 rewardsAccrued,
        uint256 newAccumulatedPerWeight,
        uint256 rewardPoolBalanceAfter,
        uint256 timestamp
    );
    
    event LPPairSet(
        address indexed lpPair,
        uint256 timestamp
    );
    
    event EmergencyWithdraw(
        address indexed owner,
        uint256 amount,
        uint256 newRewardPoolBalance,
        uint256 timestamp
    );

    event BurnOnTransfer(
        address indexed from,
        address indexed to,
        uint256 burnAmount,
        uint256 totalBurnedAfter,
        uint256 timestamp
    );

    event UserRewardDebtUpdated(
        address indexed user,
        uint256 oldDebt,
        uint256 newDebt,
        uint256 userWeight,
        uint256 timestamp
    );

    event PoolWeightChanged(
        uint256 oldTotalWeight,
        uint256 newTotalWeight,
        uint256 changeAmount,
        bool isIncrease,
        uint256 timestamp
    );

    event UserWeightChanged(
        address indexed user,
        uint256 oldTotalWeight,
        uint256 newTotalWeight,
        uint256 changeAmount,
        bool isIncrease,
        uint256 timestamp
    );

    // --- CONSTRUCTOR ---

    constructor(address trustedForwarder, address pancakeswapRouter)
        ERC20("Crikz", "CRIKZ")
        Ownable(_msgSender())
        ERC2771Context(trustedForwarder)
    {
        require(pancakeswapRouter != address(0), "Invalid router");
        PANCAKESWAP_V2_ROUTER = pancakeswapRouter;

        StakingTiers.Tier[] memory tiers = StakingTiers.initializeTiers();
        for (uint8 i = 0; i < tiers.length; i++) {
            stakingTiers.push(tiers[i]);
        }

        uint256 initialSupply = 1_000_000 * 10**decimals();
        _mint(_msgSender(), initialSupply);

        uint256 rewardAllocation = 250_000 * 10**decimals();
        _transfer(_msgSender(), address(this), rewardAllocation);
        
        rewardPool.balance = rewardAllocation;
        rewardPool.lastUpdateTime = block.timestamp;
        // Initialization of other counters
        totalStaked = 0;
        totalStakers = 0;
        totalBurned = 0;
        totalRewardsClaimed = 0;
        totalRewardsCompounded = 0;
    }

    // --- PUBLIC VIEW FUNCTIONS (FIXES SYNTAX ERROR IN YOUR LAST FILE) ---
    
    // Functions required by the test file for reading pool balance
    function getRewardPoolBalance() public view returns (uint256) {
        return rewardPool.balance;
    }

    // Functions required by the test file for reading total weight
    function getRewardPoolTotalWeight() public view returns (uint256) {
        return rewardPool.totalWeight;
    }

    // --- ERC2771 OVERRIDES ---

function _contextSuffixLength() internal view virtual override(ERC2771Context, Context) returns (uint256) {
    return super._contextSuffixLength();
}

    // Simplified overrides for ERC2771Context
    function _msgSender()
        internal
        view
        override(Context, ERC2771Context) 
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, ERC2771Context) 
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }
    
    // --- TRANSFER LOGIC ---
    
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(amount > 0, "Amount must be positive");
        
        // Exclude mint/burn/tax-exempt owner LP transfer
        if (from == address(0) || to == address(0) || (from == owner() && to == PANCAKESWAP_V2_ROUTER)) {
            super._transfer(from, to, amount);
            return;
        }

        bool isDEXTrade = _isDEXTransaction(from, to);

        if (isDEXTrade) {
            uint256 burnAmount = CrikzMath.calculateBurnFee(amount);
            uint256 netAmount = amount - burnAmount;

            if (burnAmount > 0) {
                // IMPORTANT: The burn reduces the balance of 'from' before the transfer.
                _burn(from, burnAmount);
                totalBurned += burnAmount;
                emit BurnOnTransfer(from, to, burnAmount, totalBurned, block.timestamp);
            }

            if (netAmount > 0) {
                super._transfer(from, to, netAmount);
            }
        } else {
            super._transfer(from, to, amount);
        }
    }

    function _isDEXTransaction(address from, address to) private view returns (bool) {
        return (
            from == PANCAKESWAP_V2_ROUTER ||
            to == PANCAKESWAP_V2_ROUTER ||
            from == lpPairAddress ||
            to == lpPairAddress
        );
    }

    // --- OWNER FUNCTIONS ---

    function setLPPairAddress(address _lpPairAddress) external onlyOwner {
        // Updated revert message to be more specific, matching test expectations
        require(lpPairAddress == address(0), "Crikz: LP address already set.");
        require(_lpPairAddress != address(0), "Invalid address");
        
        lpPairAddress = _lpPairAddress;
        emit LPPairSet(_lpPairAddress, block.timestamp);
    }

    function fundRewardPool(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(rewardPool.balance + amount <= MAX_REWARD_POOL, "Exceeds max pool");
        
        // Transfer from owner's balance to the contract itself
        _transfer(_msgSender(), address(this), amount);
        rewardPool.balance += amount;
        
        emit RewardPoolFunded(_msgSender(), amount, rewardPool.balance, block.timestamp);
    }

    function emergencyOwnerWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(address(this)) >= amount, "Insufficient balance");
        require(rewardPool.balance >= amount, "Exceeds reward pool");
        
        // Note: The pool balance is reduced, then the token is transferred.
        rewardPool.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        
        emit EmergencyWithdraw(_msgSender(), amount, rewardPool.balance, block.timestamp);
    }

    // --- INTERNAL HELPER FUNCTIONS ---

    // Assumes RewardDistributor.updatePool signature: (RewardPool storage pool, uint256 currentTimestamp)
    function _updatePool() internal {
        uint256 timeElapsed = block.timestamp > rewardPool.lastUpdateTime
            ? block.timestamp - rewardPool.lastUpdateTime
            : 0;

        uint256 rewardsAccrued = RewardDistributor.updatePool(rewardPool, block.timestamp);
        
        // Only emit if the pool was actually updated
        if (timeElapsed > 0 || rewardsAccrued > 0) {
            emit RewardPoolUpdated(
                timeElapsed,
                rewardsAccrued,
                rewardPool.accumulatedRewardPerWeight,
                rewardPool.balance,
                block.timestamp
            );
        }
    }

    // Assumes RewardDistributor.updateUserDebt signature: (RewardPool storage pool, uint256 userWeight)
    function _updateUserDebt(address user) internal {
        uint256 oldDebt = userRewardDebt[user];
        uint256 newDebt = RewardDistributor.updateUserDebt(rewardPool, userTotalWeight[user]);
        userRewardDebt[user] = newDebt;
        
        if (oldDebt != newDebt) {
            emit UserRewardDebtUpdated(user, oldDebt, newDebt, userTotalWeight[user], block.timestamp);
        }
    }

    function _updatePoolWeight(uint256 oldWeight, uint256 newWeight) internal {
        if (oldWeight == newWeight) return;

        bool isIncrease = newWeight > oldWeight;
        uint256 changeAmount = isIncrease ? newWeight - oldWeight : oldWeight - newWeight;

        rewardPool.totalWeight = isIncrease 
            ? rewardPool.totalWeight + changeAmount 
            : rewardPool.totalWeight - changeAmount;

        emit PoolWeightChanged(oldWeight, newWeight, changeAmount, isIncrease, block.timestamp);
    }

    function _updateUserWeight(address user, uint256 oldWeight, uint256 newWeight) internal {
        if (oldWeight == newWeight) return;

        bool isIncrease = newWeight > oldWeight;
        uint256 changeAmount = isIncrease ? newWeight - oldWeight : oldWeight - newWeight;

        userTotalWeight[user] = isIncrease
            ? userTotalWeight[user] + changeAmount
            : userTotalWeight[user] - changeAmount;

        emit UserWeightChanged(user, oldWeight, newWeight, changeAmount, isIncrease, block.timestamp);
    }
    
    // --- REWARD VIEW LOGIC ---

    function pendingRewards(address account) public view returns (uint256) {
        if (userTotalWeight[account] == 0) {
            return 0;
        }

        // Snapshot of pool state
        RewardDistributor.RewardPool memory poolSnapshot = rewardPool;
        
        if (poolSnapshot.totalWeight == 0 || poolSnapshot.balance == 0) {
            return 0;
        }

        // Simulate pool update for pending rewards calculation
        if (block.timestamp > poolSnapshot.lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - poolSnapshot.lastUpdateTime;

            uint256 rewardsAccrued = CrikzMath.calculateTimeBasedRewards(
                poolSnapshot.balance,
                timeElapsed,
                poolSnapshot.totalWeight
            );

            if (rewardsAccrued > poolSnapshot.balance) {
                rewardsAccrued = poolSnapshot.balance;
            }

            if (rewardsAccrued > 0) {
                uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
                    rewardsAccrued,
                    poolSnapshot.totalWeight
                );
                poolSnapshot.accumulatedRewardPerWeight += rewardPerWeightDelta;
            }
        }

        // Assumes RewardDistributor.calculatePending signature: (RewardPool memory pool, uint256 userWeight, uint256 userDebt)
        uint256 accumulatedRewards = (userTotalWeight[account] * poolSnapshot.accumulatedRewardPerWeight) / CrikzMath.WAD;
        
        if (accumulatedRewards <= userRewardDebt[account]) {
            return 0;
        }
        
        return accumulatedRewards - userRewardDebt[account];
    }

    // --- STAKING ACTIONS ---

    function stake(uint256 amount, uint8 tier) external nonReentrant {
        address staker = _msgSender();
        // Assuming MIN_STAKE_AMOUNT is defined in CrikzMath or is 1
        require(amount >= CrikzMath.MIN_STAKE_AMOUNT, "Amount too small"); 
        require(StakingTiers.isValidTier(tier), "Invalid tier");
        require(balanceOf(staker) >= amount, "Insufficient balance");

        _updatePool();
        _claimRewards(staker); // Claims pending rewards first

        _transfer(staker, address(this), amount);

        // Assumes StakeManager.createStake signature: (amount, tier, tierConfig, timestamp)
        StakeManager.StakeInfo memory newStake = StakeManager.createStake(
            amount,
            tier,
            stakingTiers[tier],
            block.timestamp
        );

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        // Update global and user weights/stats
        _updatePoolWeight(oldPoolWeight, oldPoolWeight + newStake.weight);
        _updateUserWeight(staker, oldUserWeight, oldUserWeight + newStake.weight);
        totalStaked += amount;
        
        uint256 stakeIndex = stakes[staker].length;
        stakes[staker].push(newStake);

        if (!hasStakes[staker]) {
            hasStakes[staker] = true;
            totalStakers += 1;
        }

        _updateUserDebt(staker);

        // Events are handled inside helpers, but staking event is here
        emit Staked(
            staker,
            amount,
            tier,
            newStake.weight,
            newStake.lockUntil,
            stakeIndex,
            block.timestamp,
            totalStaked,
            rewardPool.totalWeight
        );
    }

    function unstake(uint256 stakeIndex) external nonReentrant {
        address staker = _msgSender();
        
        // --- FIX 1: Ensure staker has a stake at this index and enforce lock time
        require(stakeIndex < stakes[staker].length, "CRKZ: Invalid stake index.");
        
        StakeManager.StakeInfo memory stakeInfo = stakes[staker][stakeIndex];
        
        require(block.timestamp >= stakeInfo.lockUntil, "CRKZ: Stake is locked");
        // --- END FIX 1 ---

        _updatePool();
        _claimRewards(staker);

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];
        uint256 amount = stakeInfo.amount; // Use stakeInfo from the retrieved struct

        // Update global and user weights/stats
        _updatePoolWeight(oldPoolWeight, oldPoolWeight - stakeInfo.weight);
        _updateUserWeight(staker, oldUserWeight, oldUserWeight - stakeInfo.weight);
        totalStaked -= amount;

        // Assumes StakeManager.removeStake removes the element efficiently
        stakes[staker].removeStake(stakeIndex);

        if (stakes[staker].length == 0) {
            hasStakes[staker] = false;
            totalStakers -= 1;
        }

        _updateUserDebt(staker);

        _transfer(address(this), staker, amount);

        emit Unstaked(
            staker,
            stakeIndex,
            amount,
            stakeInfo.weight,
            block.timestamp,
            totalStaked,
            rewardPool.totalWeight
        );
    }

    function emergencyUnstake(uint256 stakeIndex) external nonReentrant {
        address staker = _msgSender();
        require(stakeIndex < stakes[staker].length, "Invalid index");

        // --- FIX 2: Define the staker variable where it was missing
        StakeManager.StakeInfo memory stakeInfo = stakes[staker][stakeIndex]; 
        // --- END FIX 2 ---
        
        uint256 principal = stakeInfo.amount;
        uint256 weight = stakeInfo.weight;
        
        uint256 burnFee = CrikzMath.calculateBurnFee(principal);
        uint256 toUser = principal - burnFee;

        require(toUser > 0, "Burn fee would exceed principal");

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        // 1. BURN
        _burn(address(this), burnFee);
        totalBurned += burnFee;
        rewardPool.balance -= burnFee; // Deduct from pool balance
        
        // 2. Update weights/stats
        _updatePoolWeight(oldPoolWeight, oldPoolWeight - weight);
        _updateUserWeight(staker, oldUserWeight, oldUserWeight - weight);
        totalStaked -= principal;

        // 3. Remove stake
        stakes[staker].removeStake(stakeIndex);

        if (stakes[staker].length == 0) {
            hasStakes[staker] = false;
            totalStakers -= 1;
        }

        // 4. Return net principal
        _transfer(address(this), staker, toUser);

        emit EmergencyUnstaked(
            staker,
            stakeIndex,
            principal,
            burnFee,
            toUser,
            block.timestamp,
            totalBurned
        );
    }

    function _claimRewards(address staker) internal {
        _updatePool();

        uint256 pendingAmount = pendingRewards(staker);

        if (pendingAmount > 0) {
            require(rewardPool.balance >= pendingAmount, "Pool depleted");
            
            rewardPool.balance -= pendingAmount;
            totalRewardsClaimed += pendingAmount;
            userTotalRewardsClaimed[staker] += pendingAmount;

            _updateUserDebt(staker);

            // Transfer from contract balance to user
            _transfer(address(this), staker, pendingAmount);
            
            emit RewardsClaimed(
                staker,
                pendingAmount,
                block.timestamp,
                userTotalRewardsClaimed[staker],
                rewardPool.balance
            );
        } else {
            // Update debt even if claiming 0 rewards to refresh the starting point
            _updateUserDebt(staker);
        }
    }

    function claimRewards() external nonReentrant {
        _claimRewards(_msgSender());
    }

    function compoundRewards(uint256 stakeIndex) external nonReentrant {
        address staker = _msgSender();
        require(stakeIndex < stakes[staker].length, "Invalid index");

        _updatePool();

        uint256 pendingAmount = pendingRewards(staker);

        require(pendingAmount > 0, "No pending rewards");
        require(rewardPool.balance >= pendingAmount, "Pool depleted");

        rewardPool.balance -= pendingAmount;
        totalRewardsCompounded += pendingAmount;
        userTotalCompounded[staker] += pendingAmount;
        totalStaked += pendingAmount;

        StakeManager.StakeInfo storage stakeInfo = stakes[staker][stakeIndex];
        uint256 oldWeight = stakeInfo.weight;
        uint256 oldStakeAmount = stakeInfo.amount;
        
        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        // Assumes StakeManager.updateStakeAmount signature: (StakeInfo storage stake, uint256 newAmount, StakingTiers.Tier memory tierInfo) returns (oldWeight, newWeight)
        ( , uint256 newWeight) = StakeManager.updateStakeAmount(
            stakeInfo,
            stakeInfo.amount + pendingAmount,
            stakingTiers[stakeInfo.tier]
        );

        // Recalculate weight delta based on actual change
        uint256 weightDelta = newWeight > oldWeight ? newWeight - oldWeight : 0;

        _updatePoolWeight(oldPoolWeight, oldPoolWeight + weightDelta);
        _updateUserWeight(staker, oldUserWeight, oldUserWeight + weightDelta);

        _updateUserDebt(staker);

        emit RewardsCompounded(
            staker,
            stakeIndex,
            pendingAmount,
            oldStakeAmount,
            stakeInfo.amount,
            oldWeight,
            newWeight,
            block.timestamp,
            userTotalCompounded[staker],
            totalStaked,
            rewardPool.totalWeight,
            rewardPool.balance
        );
    }
    
    // --- QUERY FUNCTIONS ---

    function getStakes(address account) external view returns (StakeManager.StakeInfo[] memory) {
        return stakes[account];
    }

    function getStakingTiers() external view returns (StakingTiers.Tier[] memory) {
        return stakingTiers;
    }

    function getUserTotalWeight(address account) external view returns (uint256) {
        return userTotalWeight[account];
    }

    function getUserRewardDebt(address account) external view returns (uint256) {
        return userRewardDebt[account];
    }

    function getStakeCount(address account) external view returns (uint256) {
        return stakes[account].length;
    }

    function getStake(address account, uint256 index) external view returns (StakeManager.StakeInfo memory) {
        require(index < stakes[account].length, "Invalid index");
        return stakes[account][index];
    }
    
    // --- FIX 3: Corrected the definition of 'account' in this getter function (Line 509 was here)
    function getStakeInfoByIndex(address account, uint256 stakeIndex) external view returns (StakeManager.StakeInfo memory) {
        require(stakeIndex < stakes[account].length, "Invalid index");
        return stakes[account][stakeIndex];
    }
    // --- END FIX 3 ---

    function getRewardPoolState() external view returns (
        uint256 balance,
        uint256 accumulatedRewardPerWeight,
        uint256 lastUpdateTime,
        uint256 totalWeight
    ) {
        return (
            rewardPool.balance,
            rewardPool.accumulatedRewardPerWeight,
            rewardPool.lastUpdateTime,
            rewardPool.totalWeight
        );
    }

    function getContractStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers,
        uint256 _rewardPoolBalance,
        uint256 _rewardPoolTotalWeight,
        uint256 _totalBurned,
        uint256 _totalRewardsClaimed,
        uint256 _totalRewardsCompounded
    ) {
        return (
            totalStaked,
            totalStakers,
            rewardPool.balance,
            rewardPool.totalWeight,
            totalBurned,
            totalRewardsClaimed,
            totalRewardsCompounded
        );
    }
    
    function getUserStats(address account) external view returns (
        uint256 _totalWeight,
        uint256 _rewardDebt,
        uint256 _pendingRewards,
        uint256 _stakeCount,
        uint256 _totalRewardsClaimed,
        uint256 _totalCompounded
    ) {
        return (
            userTotalWeight[account],
            userRewardDebt[account],
            pendingRewards(account),
            stakes[account].length,
            userTotalRewardsClaimed[account],
            userTotalCompounded[account]
        );
    }

    function getStakeTimeRemaining(address account, uint256 stakeIndex) external view returns (uint256) {
        require(stakeIndex < stakes[account].length, "Invalid index");
        // Assumes StakeManager.getTimeRemaining signature: (StakeInfo memory stake, uint256 currentTimestamp)
        return StakeManager.getTimeRemaining(stakes[account][stakeIndex], block.timestamp);
    }

    function getMultipleStakesInfo(address account) external view returns (
        StakeManager.StakeInfo[] memory stakesList,
        uint256[] memory timeRemaining,
        uint256[] memory projectedRewardsPerStake
    ) {
        uint256 stakeCount = stakes[account].length;
        stakesList = new StakeManager.StakeInfo[](stakeCount);
        timeRemaining = new uint256[](stakeCount);
        projectedRewardsPerStake = new uint256[](stakeCount);

        uint256 totalPending = pendingRewards(account);

        for (uint256 i = 0; i < stakeCount; i++) {
            stakesList[i] = stakes[account][i];
            timeRemaining[i] = StakeManager.getTimeRemaining(stakes[account][i], block.timestamp);
            
            if (userTotalWeight[account] > 0) {
                // Pro-rata distribution of total pending rewards
                projectedRewardsPerStake[i] = (totalPending * stakes[account][i].weight) / userTotalWeight[account];
            } else {
                projectedRewardsPerStake[i] = 0;
            }
        }

        return (stakesList, timeRemaining, projectedRewardsPerStake);
    }

    function getRewardProjection(address account, uint256 _days) external view returns (
        uint256 projectedRewards,
        uint256 projectedAccumulatedPerWeight
    ) {
        RewardDistributor.RewardPool memory poolSnapshot = rewardPool;
        
        if (userTotalWeight[account] == 0 || poolSnapshot.totalWeight == 0) {
            return (0, poolSnapshot.accumulatedRewardPerWeight);
        }

        uint256 timeInSeconds = _days * 1 days;
        uint256 projectedAccrued = CrikzMath.calculateTimeBasedRewards(
            poolSnapshot.balance,
            timeInSeconds,
            poolSnapshot.totalWeight
        );

        if (projectedAccrued > poolSnapshot.balance) {
            projectedAccrued = poolSnapshot.balance;
        }

        uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
            projectedAccrued,
            poolSnapshot.totalWeight
        );

        projectedAccumulatedPerWeight = poolSnapshot.accumulatedRewardPerWeight + rewardPerWeightDelta;

        uint256 projectedAccumulated = (userTotalWeight[account] * projectedAccumulatedPerWeight) / CrikzMath.WAD;

        if (projectedAccumulated <= userRewardDebt[account]) {
            projectedRewards = 0;
        } else {
            projectedRewards = projectedAccumulated - userRewardDebt[account];
        }

        return (projectedRewards, projectedAccumulatedPerWeight);
    }

    function getAllUsersSnapshot() external view returns (
        uint256 totalActiveStakes,
        uint256 averageStakeSize,
        uint256 averageUserWeight
    ) {
        if (totalStakers == 0) {
            return (0, 0, 0);
        }
        
        // This logic is retained from your original code, acknowledging it's an approximation 
        // as iterating all stakes is not feasible in a public view function.
        uint256 totalActiveSt = totalStaked > 0 ? (totalStaked / (CrikzMath.MIN_STAKE_AMOUNT > 0 ? CrikzMath.MIN_STAKE_AMOUNT : 1)) : 0;

        uint256 avgStakeSize = totalStaked > 0 ? totalStaked / (totalActiveSt > 0 ? totalActiveSt : 1) : 0;
        uint256 avgUserWeight = rewardPool.totalWeight > 0 ? rewardPool.totalWeight / totalStakers : 0;

        return (totalActiveSt, avgStakeSize, avgUserWeight);
    }

    function getTierDetails(uint8 tier) external view returns (
        uint256 lockDuration,
        uint256 weightFactor,
        uint256 lockDurationInDays
    ) {
        require(StakingTiers.isValidTier(tier), "Invalid tier");
        StakingTiers.Tier memory tierInfo = stakingTiers[tier];
        return (
            tierInfo.lockDuration,
            tierInfo.weightFactor,
            tierInfo.lockDuration / 1 days
        );
    }

    function simulateStake(address account, uint256 amount, uint8 tier) external view returns (
        uint256 expectedWeight,
        uint256 expectedLockUntil,
        uint256 expectedPoolWeightAfter,
        uint256 expectedUserWeightAfter
    ) {
        require(StakingTiers.isValidTier(tier), "Invalid tier");
        require(amount > 0, "Invalid amount");

        StakingTiers.Tier memory tierInfo = stakingTiers[tier];
        uint256 weight = CrikzMath.calculateWeight(amount, tierInfo.weightFactor);
        uint256 lockUntil = block.timestamp + tierInfo.lockDuration;

        return (
            weight,
            lockUntil,
            rewardPool.totalWeight + weight,
            userTotalWeight[account] + weight
        );
    }

    function simulateCompound(address account, uint256 stakeIndex) external view returns (
        uint256 pendingAmount,
        uint256 newStakeAmount,
        uint256 newWeight,
        uint256 expectedUserWeightAfter,
        uint256 expectedPoolWeightAfter,
        uint256 expectedPoolBalanceAfter
    ) {
        require(stakeIndex < stakes[account].length, "Invalid index");

        pendingAmount = pendingRewards(account);
        
        if (pendingAmount == 0) {
            return (0, 0, 0, userTotalWeight[account], rewardPool.totalWeight, rewardPool.balance);
        }

        // --- FIX 4: Changed 'stake' to 'stakeInfo' to resolve DeclarationError on lines 868-871
        StakeManager.StakeInfo memory stakeInfo = stakes[account][stakeIndex];
        newStakeAmount = stakeInfo.amount + pendingAmount;
        newWeight = CrikzMath.calculateWeight(newStakeAmount, stakingTiers[stakeInfo.tier].weightFactor);

        uint256 weightDelta = newWeight > stakeInfo.weight ? newWeight - stakeInfo.weight : 0;
        // --- END FIX 4 ---

        return (
            pendingAmount,
            newStakeAmount,
            newWeight,
            userTotalWeight[account] + weightDelta,
            rewardPool.totalWeight + weightDelta,
            rewardPool.balance - pendingAmount
        );
    }

    function getPoolHealthMetrics() external view returns (
        uint256 rewardPoolCoverage, // % of totalStaked
        uint256 averageRewardPerStaker,
        uint256 poolAPR,
        uint256 timeUntilPoolDepletion
    ) {
        if (totalStakers == 0 || rewardPool.totalWeight == 0 || totalStaked == 0) {
            return (0, 0, 0, 0);
        }

        // Coverage: (Reward Pool Balance / Total Staked) * 100
        rewardPoolCoverage = (rewardPool.balance * 100) / totalStaked;

        // Average Reward Per Staker (Simplified: pool balance / # stakers)
        averageRewardPerStaker = rewardPool.balance / totalStakers;

        // Pool APR (based on fixed BASE_APR_RATE)
        uint256 annualReward = (rewardPool.balance * CrikzMath.BASE_APR_RATE) / CrikzMath.WAD;
        // poolAPR = (annualReward / rewardPool.balance) * 100 * WAD (Simplified to percentage)
        poolAPR = (CrikzMath.BASE_APR_RATE * 100) / CrikzMath.WAD; // BASE_APR_RATE is 0.0618 * 1e18

        // Time Until Pool Depletion (in seconds)
        if (annualReward == 0) {
            timeUntilPoolDepletion = type(uint256).max;
        } else {
            timeUntilPoolDepletion = (rewardPool.balance * CrikzMath.SECONDS_PER_YEAR) / annualReward;
        }

        return (rewardPoolCoverage, averageRewardPerStaker, poolAPR, timeUntilPoolDepletion);
    }

    // Note: The logic for userRank is highly simplified and will likely need external off-chain calculation
    function getUserComparisonMetrics(address account) external view returns (
        uint256 userStakePercentage, // User staked amount / Total Staked
        uint256 userWeightPercentage, // User weight / Total Pool Weight
        uint256 userRewardShare, // User total claimed / Global total claimed
        uint256 userRank
    ) {
        if (totalStaked == 0 || rewardPool.totalWeight == 0) {
            return (0, 0, 0, 0);
        }

        // Get total amount staked by user (must calculate this manually since it's not a stored variable)
        uint256 userStakedAmount;
        for (uint256 i = 0; i < stakes[account].length; i++) {
            userStakedAmount += stakes[account][i].amount;
        }

        userStakePercentage = (userStakedAmount * 100) / totalStaked;
        userWeightPercentage = (userTotalWeight[account] * 100) / rewardPool.totalWeight;
        
        if (totalRewardsClaimed > 0) {
            userRewardShare = (userTotalRewardsClaimed[account] * 100) / totalRewardsClaimed;
        } else {
            userRewardShare = 0;
        }

        // User rank is highly complex and cannot be reliably calculated in a single on-chain view function.
        // Returning 0 as a placeholder for the rank.
        userRank = 0; 
        
        return (userStakePercentage, userWeightPercentage, userRewardShare, userRank);
    }
}