// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CrikzMath.sol";

library WageDistributor {
    using CrikzMath for uint256;

    error PoolDepleted();
    error NoWagesToClaim();

    struct WagePool {
        uint256 balance;
        uint256 accumulatedWagePerReputation;
        uint256 lastUpdateTime;
        uint256 totalReputation;
    }

    function updateUserDebt(
        WagePool memory pool,
        uint256 userReputation
    ) internal pure returns (uint256 newDebt) {
        return (userReputation * pool.accumulatedWagePerReputation) / CrikzMath.WAD;
    }

    function updatePool(
        WagePool storage pool,
        uint256 currentTimestamp
    ) internal returns (uint256 wagesAccrued) {
        uint256 timeElapsed = currentTimestamp > pool.lastUpdateTime
            ? currentTimestamp - pool.lastUpdateTime
            : 0;
            
        if (timeElapsed == 0 || pool.totalReputation == 0 || pool.balance == 0) {
            pool.lastUpdateTime = currentTimestamp;
            return 0;
        }

        wagesAccrued = CrikzMath.calculateTimeBasedWages(
            pool.balance,
            timeElapsed,
            pool.totalReputation
        );
        
        if (wagesAccrued > pool.balance) {
            wagesAccrued = pool.balance;
        }
        
        if (wagesAccrued > 0) {
            uint256 wagePerReputationDelta = CrikzMath.calculateWagePerReputation(
                wagesAccrued,
                pool.totalReputation
            );
            pool.accumulatedWagePerReputation += wagePerReputationDelta;
        }
        
        pool.lastUpdateTime = currentTimestamp;
        return wagesAccrued;
    }

    function validateSufficientBalance(WagePool memory pool, uint256 required) internal pure {
        if (pool.balance < required) revert PoolDepleted();
    }

    function validatePendingWages(uint256 pending) internal pure {
        if (pending == 0) revert NoWagesToClaim();
    }
}