// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CrikzMath.sol";

library SalaryDistributor {
    using CrikzMath for uint256;

    error FundDepleted();
    error NoSalaryToClaim();

    struct RewardFund {
        uint256 balance;
        uint256 accumulatedSalaryPerReputation;
        uint256 lastUpdateTime;
        uint256 totalReputation;
    }

    function updateFund(RewardFund storage fund, uint256 currentTimestamp) internal {
        uint256 timeElapsed = currentTimestamp > fund.lastUpdateTime ? currentTimestamp - fund.lastUpdateTime : 0;
        if (timeElapsed == 0 || fund.totalReputation == 0 || fund.balance == 0) {
            fund.lastUpdateTime = currentTimestamp;
            return;
        }

        uint256 salaryAccrued = CrikzMath.calculateTimeBasedSalary(fund.balance, timeElapsed, fund.totalReputation);
        
        if (salaryAccrued > fund.balance) {
            salaryAccrued = fund.balance;
        }

        if (salaryAccrued > 0) {
            fund.accumulatedSalaryPerReputation += CrikzMath.calculateSalaryPerReputation(salaryAccrued, fund.totalReputation);
        }
        
        fund.lastUpdateTime = currentTimestamp;
    }

    function updateUserDebt(RewardFund memory fund, uint256 userReputation) internal pure returns (uint256) {
        return (userReputation * fund.accumulatedSalaryPerReputation) / CrikzMath.WAD;
    }

    function validateSufficientBalance(RewardFund memory fund, uint256 required) internal pure {
        if (fund.balance < required) revert FundDepleted();
    }

    function validatePendingSalary(uint256 pending) internal pure {
        if (pending == 0) revert NoSalaryToClaim();
    }
}