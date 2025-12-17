// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CrikzMath.sol";

library ProductionDistributor {
    struct ProductionFund {
        uint256 balance;
        uint256 totalReputation;
        uint256 accumulatedYieldPerReputation;
        uint256 lastUpdateTime;
    }

    error NoProductsToClaim();

    function updateFund(ProductionFund storage fund, uint256 currentTime) internal {
        if (fund.totalReputation == 0 || fund.balance == 0) {
            fund.lastUpdateTime = currentTime;
            return;
        }

        uint256 timePassed = currentTime - fund.lastUpdateTime;
        if (timePassed == 0) return;

        // Yield calculation aligned with 6.182% APR test
        // APR = (YieldPerSec * SecondsPerYear) / Principal
        uint256 yieldGenerated = (fund.balance * timePassed * 6182) / (100000 * 365 days);
        
        fund.accumulatedYieldPerReputation += (yieldGenerated * CrikzMath.WAD) / fund.totalReputation;
        fund.lastUpdateTime = currentTime;
    }
}