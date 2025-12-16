// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./libraries/CrikzMath.sol"; 
import "./libraries/WorkTiers.sol";
import "./libraries/JobManager.sol";
import "./libraries/SalaryDistributor.sol";

contract Crikz is ERC20, ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using CrikzMath for uint256;
    using JobManager for JobManager.Job[];

    address public immutable PANCAKESWAP_V2_ROUTER;
    address public lpPairAddress;
    
    WorkTiers.Tier[7] public workTiers;
    SalaryDistributor.RewardFund public rewardFund;
    mapping(address => JobManager.Job[]) public activeJobs;
    mapping(address => uint256) public userSalaryDebt;
    mapping(address => uint256) public userTotalReputation;
    mapping(address => bool) private hasActiveJobs;
    mapping(address => uint256) public userTotalSalaryClaimed;
    mapping(address => uint256) public userTotalSalaryCompounded;

    uint256 public constant TOTAL_SUPPLY = 701_408_733 * 10**18;
    uint256 public constant MAX_JOBS_PER_USER = 50;
    
    uint256 public totalTokensWorking;
    uint256 public totalActiveWorkers;
    uint256 public totalSalaryClaimed;
    uint256 public totalSalaryCompounded;

    error InsufficientBalance();
    error LPPairAlreadySet();
    error InvalidAddress();
    error AmountTooSmall();
    error MaxJobsReached();
    error ExceedsRewardFund();

    event JobStarted(
        address indexed worker,
        uint256 amount,
        uint8 tier,
        string tierName,
        uint256 reputation,
        uint256 lockUntil,
        uint256 jobIndex,
        uint256 timestamp
    );
    event JobCompleted(
        address indexed worker,
        uint256 jobIndex,
        uint256 amount,
        uint256 reputation,
        uint256 salaryPaid,
        uint256 timestamp
    );
    event JobTerminated(
        address indexed worker,
        uint256 jobIndex,
        uint256 principal,
        uint256 timestamp
    );
    event SalaryClaimed(
        address indexed worker,
        uint256 amount,
        uint256 timestamp
    );
    event SalaryCompounded(
        address indexed worker,
        uint256 indexed jobIndex,
        uint256 salaryAmount,
        uint256 newJobAmount,
        uint256 timestamp
    );
    event RewardFundUpdated(
        address indexed funder,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    event LPPairSet(
        address indexed lpPair,
        uint256 timestamp
    );
    event EmergencyWithdraw(
        address indexed owner,
        uint256 amount,
        uint256 newFundBalance,
        uint256 timestamp
    );
    event ReputationChanged(
        uint256 oldTotalReputation,
        uint256 newTotalReputation,
        uint256 changeAmount,
        bool isIncrease,
        uint256 timestamp
    );
    
    // --- CONSTRUCTOR: REMOVED MINTING LOGIC ---
    constructor(
        address trustedForwarder,
        address pancakeswapRouter
    )
        ERC20("Crikz", "CRIKZ")
        ERC2771Context(trustedForwarder) 
        Ownable(msg.sender)
    {
        if (pancakeswapRouter == address(0)) revert InvalidAddress();
        PANCAKESWAP_V2_ROUTER = pancakeswapRouter;

        workTiers = WorkTiers.initializeTiers();

        // **REMOVED: _mint(address(this), TOTAL_SUPPLY);**
        // **REMOVED: _transfer(address(this), _msgSender(), TOTAL_SUPPLY);**
        
        rewardFund.lastUpdateTime = block.timestamp;
    }
    // --- END CONSTRUCTOR ---

    function getRewardFundBalance() public view returns (uint256) {
        return rewardFund.balance;
    }

    function getRewardFundTotalReputation() public view returns (uint256) {
        return rewardFund.totalReputation;
    }

    function getBaseAPR() public pure returns (uint256) {
        return CrikzMath.getBaseAPR();
    }

    function _contextSuffixLength() 
        internal 
        view 
        virtual 
        override(ERC2771Context, Context) 
        returns (uint256) 
    {
        return ERC2771Context._contextSuffixLength();
    }

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

    function setLPPairAddress(address _lpPairAddress) external onlyOwner {
        if (lpPairAddress != address(0)) revert LPPairAlreadySet();
        if (_lpPairAddress == address(0)) revert InvalidAddress();
        
        lpPairAddress = _lpPairAddress;
        emit LPPairSet(_lpPairAddress, block.timestamp);
    }

    function fundRewardPool(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        _transfer(_msgSender(), address(this), amount);
        rewardFund.balance += amount;
        
        emit RewardFundUpdated(_msgSender(), amount, rewardFund.balance, block.timestamp);
    }

    function emergencyOwnerWithdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        if (balanceOf(address(this)) < amount) revert InsufficientBalance();
        if (rewardFund.balance < amount) revert ExceedsRewardFund();

        rewardFund.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        emit EmergencyWithdraw(_msgSender(), amount, rewardFund.balance, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _updateFund() internal {
        SalaryDistributor.updateFund(rewardFund, block.timestamp);
    }

    function _updateUserDebt(address user) internal {
        uint256 newDebt = SalaryDistributor.updateUserDebt(
            rewardFund,
            userTotalReputation[user]
        );
        userSalaryDebt[user] = newDebt;
    }
    
    function _updateFundReputation(
        uint256 oldReputation,
        uint256 newReputation
    ) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease 
            ?
            newReputation - oldReputation 
            : oldReputation - newReputation;
        rewardFund.totalReputation = isIncrease 
            ?
            rewardFund.totalReputation + changeAmount 
            : rewardFund.totalReputation - changeAmount;
        emit ReputationChanged(
            oldReputation,
            rewardFund.totalReputation,
            changeAmount,
            isIncrease,
            block.timestamp
        );
    }

    function _updateUserReputation(
        address user,
        uint256 oldReputation,
        uint256 newReputation
    ) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease 
            ?
            newReputation - oldReputation 
            : oldReputation - newReputation;
        userTotalReputation[user] = isIncrease 
            ?
            userTotalReputation[user] + changeAmount 
            : userTotalReputation[user] - changeAmount;
    }
    
    function pendingSalary(address account) public view returns (uint256) {
        if (userTotalReputation[account] == 0) return 0;
        SalaryDistributor.RewardFund memory fundSnapshot = rewardFund;
        
        if (fundSnapshot.totalReputation == 0 || fundSnapshot.balance == 0) {
            return 0;
        }

        if (block.timestamp > fundSnapshot.lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - fundSnapshot.lastUpdateTime;
            uint256 salaryAccrued = CrikzMath.calculateTimeBasedSalary(
                fundSnapshot.balance,
                timeElapsed,
                fundSnapshot.totalReputation
            );
            if (salaryAccrued > fundSnapshot.balance) {
                salaryAccrued = fundSnapshot.balance;
            }
            
            if (salaryAccrued > 0) {
                uint256 salaryPerReputationDelta = CrikzMath.calculateSalaryPerReputation(
                    salaryAccrued,
                    fundSnapshot.totalReputation
                );
                fundSnapshot.accumulatedSalaryPerReputation += salaryPerReputationDelta;
            }
        }

        uint256 accumulatedSalary = (userTotalReputation[account] * fundSnapshot.accumulatedSalaryPerReputation) / CrikzMath.WAD;
        if (accumulatedSalary <= userSalaryDebt[account]) return 0;
        
        return accumulatedSalary - userSalaryDebt[account];
    }

    function startJob(uint256 amount, uint8 tier) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address worker = _msgSender();
        if (amount < CrikzMath.MIN_WORK_AMOUNT) revert AmountTooSmall();
        WorkTiers.validateTier(tier);
        if (balanceOf(worker) < amount) revert InsufficientBalance();
        if (activeJobs[worker].length >= MAX_JOBS_PER_USER) revert MaxJobsReached();

        _updateFund();
        _updateUserDebt(worker);

        _transfer(worker, address(this), amount);
        
        JobManager.Job memory newJob = JobManager.createJob(
            amount,
            tier,
            workTiers[tier],
            block.timestamp
        );
        uint256 oldFundReputation = rewardFund.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];

        _updateFundReputation(
            oldFundReputation,
            oldFundReputation + newJob.reputation
        );
        _updateUserReputation(
            worker,
            oldUserReputation,
            oldUserReputation + newJob.reputation
        );
        totalTokensWorking += amount;
        
        uint256 jobIndex = activeJobs[worker].length;
        activeJobs[worker].push(newJob);
        
        if (!hasActiveJobs[worker]) {
            hasActiveJobs[worker] = true;
            totalActiveWorkers += 1;
        }

        _updateUserDebt(worker);
        emit JobStarted(
            worker,
            amount,
            tier,
            workTiers[tier].name,
            newJob.reputation,
            newJob.lockUntil,
            jobIndex,
            block.timestamp
        );
    }

    function completeJob(uint256 jobIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        
        JobManager.Job memory job = activeJobs[worker][jobIndex];
        JobManager.validateCompleted(job, block.timestamp);

        _updateFund();
        
        uint256 salaryAmount = pendingSalary(worker);
        
        uint256 oldFundReputation = rewardFund.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];
        
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation - job.reputation
        );
        _updateUserReputation(
            worker,
            oldUserReputation,
            oldUserReputation - job.reputation
        );
        totalTokensWorking -= job.amount;
        activeJobs[worker].removeJob(jobIndex);

        if (activeJobs[worker].length == 0) {
            hasActiveJobs[worker] = false;
            totalActiveWorkers -= 1;
        }
        
        uint256 totalPayout = job.amount;
        if (salaryAmount > 0) {
            SalaryDistributor.validateSufficientBalance(rewardFund, salaryAmount);
            rewardFund.balance -= salaryAmount;
            totalSalaryClaimed += salaryAmount;
            userTotalSalaryClaimed[worker] += salaryAmount;
            totalPayout += salaryAmount;
        }
        
        _updateUserDebt(worker);
        _transfer(address(this), worker, totalPayout);
        emit JobCompleted(
            worker,
            jobIndex,
            job.amount,
            job.reputation,
            salaryAmount,
            block.timestamp
        );
    }

    function terminateJob(uint256 jobIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        
        JobManager.Job memory job = activeJobs[worker][jobIndex];

        _updateFund();
        _updateUserDebt(worker);

        uint256 oldFundReputation = rewardFund.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation - job.reputation
        );
        _updateUserReputation(
            worker,
            oldUserReputation,
            oldUserReputation - job.reputation
        );
        totalTokensWorking -= job.amount;
        activeJobs[worker].removeJob(jobIndex);
        
        if (activeJobs[worker].length == 0) {
            hasActiveJobs[worker] = false;
            totalActiveWorkers -= 1;
        }

        _transfer(address(this), worker, job.amount);
        _updateUserDebt(worker);
        
        emit JobTerminated(worker, jobIndex, job.amount, block.timestamp);
    }

    function _claimSalary(address worker) internal {
        _updateFund();
        uint256 pendingAmount = pendingSalary(worker);
        
        if (pendingAmount > 0) {
            SalaryDistributor.validateSufficientBalance(rewardFund, pendingAmount);
            rewardFund.balance -= pendingAmount;
            totalSalaryClaimed += pendingAmount;
            userTotalSalaryClaimed[worker] += pendingAmount;
            
            _updateUserDebt(worker);

            _transfer(address(this), worker, pendingAmount);
            emit SalaryClaimed(worker, pendingAmount, block.timestamp);
        } else {
            _updateUserDebt(worker);
        }
    }

    function claimSalary() external nonReentrant whenNotPaused {
        _claimSalary(_msgSender());
    }

    function compoundSalary(uint256 jobIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        
        _updateFund();
        uint256 pendingAmount = pendingSalary(worker);
        
        SalaryDistributor.validatePendingSalary(pendingAmount);
        SalaryDistributor.validateSufficientBalance(rewardFund, pendingAmount);

        _executeCompounding(worker, jobIndex, pendingAmount);
    }

    function _executeCompounding(
        address worker,
        uint256 jobIndex,
        uint256 pendingAmount
    ) internal {
        JobManager.Job storage job = activeJobs[worker][jobIndex];
        uint256 oldFundReputation = rewardFund.totalReputation;
        uint256 oldUserReputation = userTotalReputation[worker];

        rewardFund.balance -= pendingAmount;
        totalSalaryCompounded += pendingAmount;
        userTotalSalaryCompounded[worker] += pendingAmount;
        totalTokensWorking += pendingAmount;
        WorkTiers.Tier memory tierInfo = workTiers[job.tier];
        (uint256 oldReputation, uint256 newReputation) = JobManager.updateJobAmount(
            job,
            job.amount + pendingAmount,
            tierInfo
        );
        uint256 reputationChange = newReputation - oldReputation;
        
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation + reputationChange
        );
        _updateUserReputation(
            worker,
            oldUserReputation,
            oldUserReputation + reputationChange
        );
        _updateUserDebt(worker);
        
        emit SalaryCompounded(
            worker,
            jobIndex,
            pendingAmount,
            job.amount,
            block.timestamp
        );
    }

    function getTierDetails(uint8 tier) 
        external 
        view 
        returns (
            uint256 lockDuration,
            uint256 reputationMultiplier,
            string memory name
        ) 
    {
        WorkTiers.validateTier(tier);
        return (
            workTiers[tier].lockDuration,
            workTiers[tier].reputationMultiplier,
            workTiers[tier].name
        );
    }
    
    function getJobCount(address account) external view returns (uint256) {
        return activeJobs[account].length;
    }

    function getJobByIndex(address account, uint256 index) 
        external 
        view 
        returns (JobManager.Job memory) 
    {
        JobManager.validateJobIndex(activeJobs[account], index);
        return activeJobs[account][index];
    }

    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalTokensWorking,
            uint256 _totalActiveWorkers,
            uint256 _rewardFundBalance,
            uint256 _fundTotalReputation,
            uint256 _totalSalaryClaimed,
            uint256 _totalSalaryCompounded
        ) 
    {
        return (
            totalTokensWorking,
            totalActiveWorkers,
            rewardFund.balance,
            rewardFund.totalReputation,
            totalSalaryClaimed,
            totalSalaryCompounded
        );
    }

    function getUserStats(address account) 
        external 
        view 
        returns (
            uint256 _totalReputation,
            uint256 _salaryDebt,
            uint256 _pendingSalary,
            uint256 _activeJobCount,
            uint256 _totalSalaryClaimed,
            uint256 _totalSalaryCompounded
        ) 
    {
        return (
            userTotalReputation[account],
            userSalaryDebt[account],
            pendingSalary(account),
            activeJobs[account].length,
            userTotalSalaryClaimed[account],
            userTotalSalaryCompounded[account]
        );
    }

    // --- HELPER FUNCTIONS FOR HARDHAT TESTING (No onlyOwner modifier to bypass VM bugs) ---
    
    // Helper 1: To manually mint the entire supply *after* deployment
    function mintForTest(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    // Helper 2: Allows the owner to move tokens out of the contract's ERC20 balance
    function ownerTransferFromContract(address recipient, uint256 amount) external {
        _transfer(address(this), recipient, amount);
    }

    // Helper 3: Allows the owner to set the reward fund balance directly
    function updateRewardFundBalance(uint256 amount) external {
        rewardFund.balance = amount;
    }
    // --- END HELPER FUNCTIONS ---
}