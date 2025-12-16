// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CrikzMath.sol";

library ProductionDistributor {
    using CrikzMath for uint256;

    error ProductionFundDepleted();
    error NoProductsToClaim();

    struct ProductionFund {
        uint256 balance;
        uint256 accumulatedYieldPerReputation;
        uint256 lastUpdateTime;
        uint256 totalReputation;
    }

    function updateCreatorDebt(
        ProductionFund memory fund,
        uint256 creatorReputation
    ) internal pure returns (uint256) {
        return (creatorReputation * fund.accumulatedYieldPerReputation) / CrikzMath.WAD;
    }

    function updateFund(
        ProductionFund storage fund,
        uint256 currentTimestamp
    ) internal returns (uint256 yieldAccrued) {
        uint256 timeElapsed = currentTimestamp > fund.lastUpdateTime
            ? currentTimestamp - fund.lastUpdateTime
            : 0;

        if (timeElapsed == 0 || fund.totalReputation == 0 || fund.balance == 0) {
            fund.lastUpdateTime = currentTimestamp;
            return 0;
        }

        yieldAccrued = CrikzMath.calculateTimeBasedYield(
            fund.balance,
            timeElapsed,
            fund.totalReputation
        );

        if (yieldAccrued > fund.balance) {
            yieldAccrued = fund.balance;
        }
        
        if (yieldAccrued > 0) {
            uint256 yieldPerReputationDelta = CrikzMath.calculateYieldPerReputation(
                yieldAccrued,
                fund.totalReputation
            );
            fund.accumulatedYieldPerReputation += yieldPerReputationDelta;
        }
        
        fund.lastUpdateTime = currentTimestamp;
        return yieldAccrued;
    }

    function validateSufficientBalance(
        ProductionFund memory fund,
        uint256 required
    ) internal pure {
        if (fund.balance < required) revert ProductionFundDepleted();
    }

    function validatePendingProducts(uint256 pending) internal pure {
        if (pending == 0) revert NoProductsToClaim();
    }
}