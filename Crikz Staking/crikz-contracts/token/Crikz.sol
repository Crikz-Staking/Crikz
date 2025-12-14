// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "../libraries/CrikzMath.sol";
import "../libraries/StakeManager.sol";
import "../libraries/RewardDistributor.sol";
import "../libraries/StakingTiers.sol";


contract Crikz is ERC20, Ownable, ReentrancyGuard, ERC2771Context {
    using CrikzMath for uint256;
    using StakeManager for StakeManager.StakeInfo[];

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
        totalStaked = 0;
        totalStakers = 0;
        totalBurned = 0;
        totalRewardsClaimed = 0;
        totalRewardsCompounded = 0;
    }

function _contextSuffixLength()
    internal
    view
    override(Context, ERC2771Context)
    returns (uint256)
{
    // Calling ERC2771Context's implementation, which calls the Context one internally.
    return ERC2771Context._contextSuffixLength();
}

function _msgSender()
    internal
    view
    override(Context, ERC2771Context) // Must list both parents
    returns (address)
{
    // You are currently calling ERC2771Context's implementation, which is correct.
    return ERC2771Context._msgSender();
}

function _msgData()
    internal
    view
    override(Context, ERC2771Context) // Must list both parents
    returns (bytes calldata)
{
    // You are currently calling ERC2771Context's implementation, which is correct.
    return ERC2771Context._msgData();
}
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(amount > 0, "Amount must be positive");
        
        if (from == address(0) || to == address(0)) {
            super._transfer(from, to, amount);
            return;
        }

        if (from == owner() && to == PANCAKESWAP_V2_ROUTER) {
            super._transfer(from, to, amount);
            return;
        }

        bool isDEXTrade = _isDEXTransaction(from, to);

        if (isDEXTrade) {
            uint256 burnAmount = CrikzMath.calculateBurnFee(amount);
            uint256 netAmount = amount - burnAmount;

            if (burnAmount > 0) {
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

    function setLPPairAddress(address _lpPairAddress) external onlyOwner {
        require(lpPairAddress == address(0), "LP address set");
        require(_lpPairAddress != address(0), "Invalid address");
        
        lpPairAddress = _lpPairAddress;
        emit LPPairSet(_lpPairAddress, block.timestamp);
    }

    function fundRewardPool(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(rewardPool.balance + amount <= MAX_REWARD_POOL, "Exceeds max pool");
        
        _transfer(_msgSender(), address(this), amount);
        rewardPool.balance += amount;
        
        emit RewardPoolFunded(_msgSender(), amount, rewardPool.balance, block.timestamp);
    }

    function emergencyOwnerWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(balanceOf(address(this)) >= amount, "Insufficient balance");
        require(rewardPool.balance >= amount, "Exceeds reward pool");
        
        rewardPool.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        
        emit EmergencyWithdraw(_msgSender(), amount, rewardPool.balance, block.timestamp);
    }

    function _updatePool() internal {
        uint256 timeElapsed = block.timestamp > rewardPool.lastUpdateTime
            ? block.timestamp - rewardPool.lastUpdateTime
            : 0;

        uint256 rewardsAccrued = RewardDistributor.updatePool(rewardPool, block.timestamp);
        
        emit RewardPoolUpdated(
            timeElapsed,
            rewardsAccrued,
            rewardPool.accumulatedRewardPerWeight,
            rewardPool.balance,
            block.timestamp
        );
    }

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

    function pendingRewards(address account) public view returns (uint256) {
        if (userTotalWeight[account] == 0) {
            return 0;
        }

        RewardDistributor.RewardPool memory poolSnapshot = rewardPool;
        
        if (poolSnapshot.totalWeight == 0 || poolSnapshot.balance == 0) {
            return 0;
        }

        if (block.timestamp <= poolSnapshot.lastUpdateTime) {
            return RewardDistributor.calculatePending(
                rewardPool,
                userTotalWeight[account],
                userRewardDebt[account]
            );
        }

        uint256 timeElapsed = block.timestamp - poolSnapshot.lastUpdateTime;

        uint256 rewardsAccrued = CrikzMath.calculateTimeBasedRewards(
            poolSnapshot.balance,
            timeElapsed,
            poolSnapshot.totalWeight
        );

        if (rewardsAccrued > poolSnapshot.balance) {
            rewardsAccrued = poolSnapshot.balance;
        }

        if (rewardsAccrued == 0) {
            return RewardDistributor.calculatePending(
                rewardPool,
                userTotalWeight[account],
                userRewardDebt[account]
            );
        }

        uint256 rewardPerWeightDelta = CrikzMath.calculateRewardPerWeight(
            rewardsAccrued,
            poolSnapshot.totalWeight
        );

        uint256 updatedAccumulatedReward = poolSnapshot.accumulatedRewardPerWeight + rewardPerWeightDelta;
        uint256 accumulatedRewards = (userTotalWeight[account] * updatedAccumulatedReward) / CrikzMath.WAD;
        
        if (accumulatedRewards <= userRewardDebt[account]) {
            return 0;
        }
        
        return accumulatedRewards - userRewardDebt[account];
    }

    function stake(uint256 amount, uint8 tier) external nonReentrant {
        address staker = _msgSender();
        require(amount >= CrikzMath.MIN_STAKE_AMOUNT, "Amount too small");
        require(StakingTiers.isValidTier(tier), "Invalid tier");
        require(balanceOf(staker) >= amount, "Insufficient balance");

        _updatePool();
        _claimRewards(staker);

        _transfer(staker, address(this), amount);

        StakeManager.StakeInfo memory newStake = StakeManager.createStake(
            amount,
            tier,
            stakingTiers[tier],
            block.timestamp
        );

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        rewardPool.totalWeight += newStake.weight;
        userTotalWeight[staker] += newStake.weight;
        totalStaked += amount;
        
        uint256 stakeIndex = stakes[staker].length;
        stakes[staker].push(newStake);

        if (!hasStakes[staker]) {
            hasStakes[staker] = true;
            totalStakers += 1;
        }

        _updateUserDebt(staker);

        emit PoolWeightChanged(oldPoolWeight, rewardPool.totalWeight, newStake.weight, true, block.timestamp);
        emit UserWeightChanged(staker, oldUserWeight, userTotalWeight[staker], newStake.weight, true, block.timestamp);

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
        require(stakeIndex < stakes[staker].length, "Invalid index");

        StakeManager.StakeInfo memory stakeInfo = stakes[staker][stakeIndex];
        require(StakeManager.isUnlocked(stakeInfo, block.timestamp), "Locked");

        _updatePool();
        _claimRewards(staker);

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        rewardPool.totalWeight -= stakeInfo.weight;
        userTotalWeight[staker] -= stakeInfo.weight;
        totalStaked -= stakeInfo.amount;

        uint256 amount = stakeInfo.amount;
        stakes[staker].removeStake(stakeIndex);

        if (stakes[staker].length == 0) {
            hasStakes[staker] = false;
            totalStakers -= 1;
        }

        _updateUserDebt(staker);

        _transfer(address(this), staker, amount);

        emit PoolWeightChanged(oldPoolWeight, rewardPool.totalWeight, stakeInfo.weight, false, block.timestamp);
        emit UserWeightChanged(staker, oldUserWeight, userTotalWeight[staker], stakeInfo.weight, false, block.timestamp);

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

        StakeManager.StakeInfo memory stakeInfo = stakes[staker][stakeIndex];
        uint256 principal = stakeInfo.amount;
        uint256 weight = stakeInfo.weight;
        
        uint256 burnFee = CrikzMath.calculateBurnFee(principal);
        uint256 toUser = principal - burnFee;

        require(toUser > 0, "Burn fee would exceed principal");

        uint256 oldPoolWeight = rewardPool.totalWeight;
        uint256 oldUserWeight = userTotalWeight[staker];

        _burn(address(this), burnFee);
        totalBurned += burnFee;
        rewardPool.balance -= burnFee;
        rewardPool.totalWeight -= weight;
        userTotalWeight[staker] -= weight;
        totalStaked -= principal;

        stakes[staker].removeStake(stakeIndex);

        if (stakes[staker].length == 0) {
            hasStakes[staker] = false;
            totalStakers -= 1;
        }

        _transfer(address(this), staker, toUser);

        emit PoolWeightChanged(oldPoolWeight, rewardPool.totalWeight, weight, false, block.timestamp);
        emit UserWeightChanged(staker, oldUserWeight, userTotalWeight[staker], weight, false, block.timestamp);

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

        uint256 pendingAmount = RewardDistributor.calculatePending(
            rewardPool,
            userTotalWeight[staker],
            userRewardDebt[staker]
        );

        if (pendingAmount > 0 && rewardPool.balance >= pendingAmount) {
            rewardPool.balance -= pendingAmount;
            totalRewardsClaimed += pendingAmount;
            userTotalRewardsClaimed[staker] += pendingAmount;

            _updateUserDebt(staker);

            _transfer(address(this), staker, pendingAmount);
            
            emit RewardsClaimed(
                staker,
                pendingAmount,
                block.timestamp,
                userTotalRewardsClaimed[staker],
                rewardPool.balance
            );
        } else {
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

        uint256 pendingAmount = RewardDistributor.calculatePending(
            rewardPool,
            userTotalWeight[staker],
            userRewardDebt[staker]
        );

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

        (uint256 returnedOldWeight, uint256 newWeight) = StakeManager.updateStakeAmount(
            stakeInfo,
            stakeInfo.amount + pendingAmount,
            stakingTiers[stakeInfo.tier]
        );

        uint256 weightDelta = newWeight > oldWeight ? newWeight - oldWeight : 0;

        rewardPool.totalWeight += weightDelta;
        userTotalWeight[staker] += weightDelta;

        _updateUserDebt(staker);

        emit PoolWeightChanged(oldPoolWeight, rewardPool.totalWeight, weightDelta, true, block.timestamp);
        emit UserWeightChanged(staker, oldUserWeight, userTotalWeight[staker], weightDelta, true, block.timestamp);

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

        uint256 totalActiveSt = 0;
        for (uint256 i = 0; i < totalStakers; i++) {
            totalActiveSt += stakes[msg.sender].length;
        }

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

        StakeManager.StakeInfo memory stake = stakes[account][stakeIndex];
        newStakeAmount = stake.amount + pendingAmount;
        newWeight = CrikzMath.calculateWeight(newStakeAmount, stakingTiers[stake.tier].weightFactor);

        uint256 weightDelta = newWeight > stake.weight ? newWeight - stake.weight : 0;

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
        uint256 rewardPoolCoverage,
        uint256 averageRewardPerStaker,
        uint256 poolAPR,
        uint256 timeUntilPoolDepletion
    ) {
        if (totalStakers == 0 || rewardPool.totalWeight == 0) {
            return (0, 0, 0, 0);
        }

        rewardPoolCoverage = (rewardPool.balance * 100) / totalStaked;

        averageRewardPerStaker = rewardPool.balance / totalStakers;

        uint256 annualReward = (rewardPool.balance * CrikzMath.BASE_APR_RATE) / CrikzMath.WAD;
        poolAPR = (annualReward * 100) / rewardPool.balance;

        if (annualReward == 0) {
            timeUntilPoolDepletion = type(uint256).max;
        } else {
            timeUntilPoolDepletion = (rewardPool.balance * CrikzMath.SECONDS_PER_YEAR) / annualReward;
        }

        return (rewardPoolCoverage, averageRewardPerStaker, poolAPR, timeUntilPoolDepletion);
    }

    function getUserComparisonMetrics(address account) external view returns (
        uint256 userStakePercentage,
        uint256 userWeightPercentage,
        uint256 userRewardShare,
        uint256 userRank
    ) {
        if (totalStaked == 0 || rewardPool.totalWeight == 0) {
            return (0, 0, 0, 0);
        }

        userStakePercentage = (userTotalWeight[account] * 10000) / totalStaked;

        userWeightPercentage = (userTotalWeight[account] * 10000) / rewardPool.totalWeight;

        uint256 userPending = pendingRewards(account);
        uint256 projectedAnnual = (userPending * CrikzMath.SECONDS_PER_YEAR) / (block.timestamp - rewardPool.lastUpdateTime + 1);
        userRewardShare = totalRewardsClaimed > 0 ? (userTotalRewardsClaimed[account] * 10000) / totalRewardsClaimed : 0;

        userRank = 1;
        for (uint256 i = 0; i < 100; i++) {
            if (userTotalWeight[account] < rewardPool.totalWeight / (i + 2)) {
                userRank = i + 1;
                break;
            }
        }

        return (userStakePercentage, userWeightPercentage, userRewardShare, userRank);
    }

    function getDashboardData(address account) external view returns (
        uint256 accountBalance,
        uint256 accountStakedTotal,
        uint256 accountPendingRewards,
        uint256 accountTotalClaimed,
        uint256 accountTotalCompounded,
        uint256 accountStakeCount,
        uint256 poolBalance,
        uint256 poolTotalWeight,
        uint256 poolTotalStaked,
        uint256 globalTotalStakers,
        uint256 globalTotalBurned
    ) {
        accountBalance = balanceOf(account);
        accountStakedTotal = totalStaked;
        accountPendingRewards = pendingRewards(account);
        accountTotalClaimed = userTotalRewardsClaimed[account];
        accountTotalCompounded = userTotalCompounded[account];
        accountStakeCount = stakes[account].length;
        poolBalance = rewardPool.balance;
        poolTotalWeight = rewardPool.totalWeight;
        poolTotalStaked = totalStaked;
        globalTotalStakers = totalStakers;
        globalTotalBurned = totalBurned;

        return (
            accountBalance,
            accountStakedTotal,
            accountPendingRewards,
            accountTotalClaimed,
            accountTotalCompounded,
            accountStakeCount,
            poolBalance,
            poolTotalWeight,
            poolTotalStaked,
            globalTotalStakers,
            globalTotalBurned
        );
    }
}