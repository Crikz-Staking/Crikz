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

    event JobStarted(address indexed worker, uint256 amount, uint8 tier, uint256 reputation, uint256 jobIndex, uint256 timestamp);
    event JobCompleted(address indexed worker, uint256 jobIndex, uint256 amount, uint256 reputation, uint256 salaryPaid, uint256 timestamp);
    event JobTerminated(address indexed worker, uint256 jobIndex, uint256 principal, uint256 penaltyToFund, uint256 returned, uint256 timestamp);
    event SalaryClaimed(address indexed worker, uint256 amount, uint256 timestamp);
    event SalaryCompounded(address indexed worker, uint256 indexed jobIndex, uint256 salaryAmount, uint256 newJobAmount, uint256 timestamp);
    event RewardFundUpdated(address indexed funder, uint256 amount, uint256 newBalance, uint256 timestamp);
    event LPPairSet(address indexed lpPair, uint256 timestamp);
    event EmergencyWithdraw(address indexed owner, uint256 amount, uint256 newFundBalance, uint256 timestamp);
    event TaxToRewardFund(address indexed from, uint256 taxAmount, uint256 timestamp);

    constructor(address trustedForwarder, address pancakeswapRouter) ERC20("Crikz", "CRIKZ") ERC2771Context(trustedForwarder) Ownable(msg.sender) {
        if (pancakeswapRouter == address(0)) revert InvalidAddress();
        PANCAKESWAP_V2_ROUTER = pancakeswapRouter;

        workTiers = WorkTiers.initializeTiers();
        _mint(address(this), TOTAL_SUPPLY);
        
        uint256 fundAllocation = 410_414_531 * 10**18;
        uint256 ownerAllocation = TOTAL_SUPPLY - fundAllocation;

        rewardFund.balance = fundAllocation;
        rewardFund.lastUpdateTime = block.timestamp;
        
        _transfer(address(this), msg.sender, ownerAllocation);
    }

    function _contextSuffixLength() internal view virtual override(ERC2771Context, Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _transfer(address from, address to, uint256 amount) internal virtual override {
        if (from == address(0) || to == address(0) || from == owner() || to == owner() || from == address(this)) {
            super._transfer(from, to, amount);
            return;
        }

        bool isDEXTrade = (from == PANCAKESWAP_V2_ROUTER || to == PANCAKESWAP_V2_ROUTER || from == lpPairAddress || to == lpPairAddress);
        
        if (isDEXTrade) {
            uint256 taxAmount = CrikzMath.calculateTax(amount);
            uint256 netAmount = amount - taxAmount;

            if (taxAmount > 0) {
                super._transfer(from, address(this), taxAmount);
                rewardFund.balance += taxAmount;
                emit TaxToRewardFund(from, taxAmount, block.timestamp);
            }
            if (netAmount > 0) {
                super._transfer(from, to, netAmount);
            }
        } else {
            super._transfer(from, to, amount);
        }
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
        if (rewardFund.balance < amount) revert ExceedsRewardFund();
        rewardFund.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        emit EmergencyWithdraw(_msgSender(), amount, rewardFund.balance, block.timestamp);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _updateFund() internal {
        SalaryDistributor.updateFund(rewardFund, block.timestamp);
    }

    function _updateUserDebt(address user) internal {
        userSalaryDebt[user] = SalaryDistributor.updateUserDebt(rewardFund, userTotalReputation[user]);
    }

    function _updateReputation(address user, uint256 oldReputation, uint256 newReputation) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 change = isIncrease ? newReputation - oldReputation : oldReputation - newReputation;
        
        rewardFund.totalReputation = isIncrease ? rewardFund.totalReputation + change : rewardFund.totalReputation - change;
        userTotalReputation[user] = isIncrease ? userTotalReputation[user] + change : userTotalReputation[user] - change;
    }

    function pendingSalary(address account) public view returns (uint256) {
        if (userTotalReputation[account] == 0) return 0;
        SalaryDistributor.RewardFund memory fundSnapshot = rewardFund;
        
        if (block.timestamp > fundSnapshot.lastUpdateTime && fundSnapshot.totalReputation > 0 && fundSnapshot.balance > 0) {
            uint256 timeElapsed = block.timestamp - fundSnapshot.lastUpdateTime;
            uint256 salaryAccrued = CrikzMath.calculateTimeBasedSalary(fundSnapshot.balance, timeElapsed, fundSnapshot.totalReputation);
            if (salaryAccrued > fundSnapshot.balance) salaryAccrued = fundSnapshot.balance;
            if (salaryAccrued > 0) {
                fundSnapshot.accumulatedSalaryPerReputation += CrikzMath.calculateSalaryPerReputation(salaryAccrued, fundSnapshot.totalReputation);
            }
        }

        uint256 accumulated = (userTotalReputation[account] * fundSnapshot.accumulatedSalaryPerReputation) / CrikzMath.WAD;
        if (accumulated <= userSalaryDebt[account]) return 0;
        return accumulated - userSalaryDebt[account];
    }

    function startJob(uint256 amount, uint8 tier) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        if (amount < CrikzMath.MIN_WORK_AMOUNT) revert AmountTooSmall();
        WorkTiers.validateTier(tier);
        if (activeJobs[worker].length >= MAX_JOBS_PER_USER) revert MaxJobsReached();

        _updateFund();
        _updateUserDebt(worker);
        _transfer(worker, address(this), amount);
        
        JobManager.Job memory newJob = JobManager.createJob(amount, tier, workTiers[tier], block.timestamp);
        
        uint256 oldRep = userTotalReputation[worker];
        _updateReputation(worker, oldRep, oldRep + newJob.reputation);
        
        totalTokensWorking += amount;
        uint256 jobIndex = activeJobs[worker].length;
        activeJobs[worker].push(newJob);
        
        if (!hasActiveJobs[worker]) {
            hasActiveJobs[worker] = true;
            totalActiveWorkers++;
        }
        _updateUserDebt(worker);
        emit JobStarted(worker, amount, tier, newJob.reputation, jobIndex, block.timestamp);
    }

    function completeJob(uint256 jobIndex) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        JobManager.Job memory job = activeJobs[worker][jobIndex];
        JobManager.validateCompleted(job, block.timestamp);

        _updateFund();
        uint256 salary = pendingSalary(worker);
        
        uint256 oldRep = userTotalReputation[worker];
        _updateReputation(worker, oldRep, oldRep - job.reputation);
        
        totalTokensWorking -= job.amount;
        activeJobs[worker].removeJob(jobIndex);

        if (activeJobs[worker].length == 0) {
            hasActiveJobs[worker] = false;
            totalActiveWorkers--;
        }
        
        uint256 payout = job.amount;
        if (salary > 0) {
            SalaryDistributor.validateSufficientBalance(rewardFund, salary);
            rewardFund.balance -= salary;
            totalSalaryClaimed += salary;
            userTotalSalaryClaimed[worker] += salary;
            payout += salary;
        }
        
        _updateUserDebt(worker);
        _transfer(address(this), worker, payout);
        emit JobCompleted(worker, jobIndex, job.amount, job.reputation, salary, block.timestamp);
    }

    function terminateJob(uint256 jobIndex) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        JobManager.Job memory job = activeJobs[worker][jobIndex];

        _updateFund();
        _updateUserDebt(worker);

        uint256 oldRep = userTotalReputation[worker];
        _updateReputation(worker, oldRep, oldRep - job.reputation);
        
        totalTokensWorking -= job.amount;
        activeJobs[worker].removeJob(jobIndex);
        
        if (activeJobs[worker].length == 0) {
            hasActiveJobs[worker] = false;
            totalActiveWorkers--;
        }

        uint256 penalty = CrikzMath.calculateTax(job.amount);
        uint256 returnAmount = job.amount - penalty;
        
        if (penalty > 0) {
            rewardFund.balance += penalty;
        }

        _transfer(address(this), worker, returnAmount);
        _updateUserDebt(worker);
        emit JobTerminated(worker, jobIndex, job.amount, penalty, returnAmount, block.timestamp);
    }

    function claimSalary() external nonReentrant whenNotPaused {
        address worker = _msgSender();
        _updateFund();
        uint256 salary = pendingSalary(worker);
        SalaryDistributor.validatePendingSalary(salary);
        SalaryDistributor.validateSufficientBalance(rewardFund, salary);

        rewardFund.balance -= salary;
        totalSalaryClaimed += salary;
        userTotalSalaryClaimed[worker] += salary;
        
        _updateUserDebt(worker);
        _transfer(address(this), worker, salary);
        emit SalaryClaimed(worker, salary, block.timestamp);
    }

    function claimAllSalary() external nonReentrant whenNotPaused {
        claimSalary(); 
    }

    function compoundSalary(uint256 jobIndex) external nonReentrant whenNotPaused {
        address worker = _msgSender();
        JobManager.validateJobIndex(activeJobs[worker], jobIndex);
        _updateFund();
        uint256 salary = pendingSalary(worker);
        SalaryDistributor.validatePendingSalary(salary);
        SalaryDistributor.validateSufficientBalance(rewardFund, salary);

        JobManager.Job storage job = activeJobs[worker][jobIndex];
        
        rewardFund.balance -= salary;
        totalSalaryCompounded += salary;
        userTotalSalaryCompounded[worker] += salary;
        totalTokensWorking += salary;

        WorkTiers.Tier memory tierInfo = workTiers[job.tier];
        
        uint256 oldRep = userTotalReputation[worker];
        (uint256 oldJobRep, uint256 newJobRep) = JobManager.updateJobAmount(job, job.amount + salary, tierInfo);
        
        uint256 repChange = newJobRep - oldJobRep;
        _updateReputation(worker, oldRep, oldRep + repChange);
        
        _updateUserDebt(worker);
        emit SalaryCompounded(worker, jobIndex, salary, job.amount, block.timestamp);
    }

    function compoundAllSalary(uint256 targetJobIndex) external nonReentrant whenNotPaused {
        compoundSalary(targetJobIndex);
    }
}