// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library CrikzMath {
    uint256 public constant WAD = 1e18;
    uint256 public constant BASE_APR = 618 * 10**15;
    uint256 public constant SECONDS_PER_YEAR = 31550400;
    uint256 public constant TAX_NUMERATOR = 1618;
    uint256 public constant TAX_DENOMINATOR = 100000;
    uint256 public constant MIN_WORK_AMOUNT = 1 * WAD;

    error InvalidAmount();
    error InvalidReputation();
    error DivisionByZero();

    function calculateTax(uint256 amount) internal pure returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        return (amount * TAX_NUMERATOR) / TAX_DENOMINATOR;
    }

    function calculateReputation(uint256 amount, uint256 multiplier) internal pure returns (uint256) {
        if (amount == 0) revert InvalidAmount();
        return (amount * multiplier) / WAD;
    }

    function calculateTimeBasedSalary(uint256 fundBalance, uint256 timeElapsed, uint256 totalReputation) internal pure returns (uint256) {
        if (totalReputation == 0 || fundBalance == 0) return 0;
        uint256 salary = (fundBalance * BASE_APR) / WAD;
        return (salary * timeElapsed) / SECONDS_PER_YEAR;
    }

    function calculateSalaryPerReputation(uint256 salaryAccrued, uint256 totalReputation) internal pure returns (uint256) {
        if (salaryAccrued == 0 || totalReputation == 0) return 0;
        return (salaryAccrued * WAD) / totalReputation;
    }
}