// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SportsBetting is Ownable, ReentrancyGuard {
    IERC20 public bettingToken;

    struct Bet {
        address bettor;
        string matchId;
        uint8 selection; // 0=Home, 1=Draw, 2=Away
        uint256 amount;
        uint256 odds; // Scaled by 100 (e.g. 1.50x = 150)
        bool settled;
        bool won;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public nextBetId;
    
    // Events
    event BetPlaced(uint256 indexed id, address indexed user, string matchId, uint256 amount, uint256 odds);
    event BetSettled(uint256 indexed id, bool won, uint256 payout);

    constructor(address _token) Ownable(msg.sender) {
        bettingToken = IERC20(_token);
    }

    function placeBet(string calldata _matchId, uint8 _selection, uint256 _amount, uint256 _odds) external nonReentrant {
        require(_amount > 0, "Bet amount must be > 0");
        require(bettingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        bets[nextBetId] = Bet({
            bettor: msg.sender,
            matchId: _matchId,
            selection: _selection,
            amount: _amount,
            odds: _odds,
            settled: false,
            won: false
        });

        emit BetPlaced(nextBetId, msg.sender, _matchId, _amount, _odds);
        nextBetId++;
    }

    // In a real Stake.com clone, this is called by a Chainlink Node (Oracle).
    // For this prototype, the "Architect" (Admin) resolves matches.
    function settleBet(uint256 _betId, bool _won) external onlyOwner {
        Bet storage bet = bets[_betId];
        require(!bet.settled, "Already settled");

        bet.settled = true;
        bet.won = _won;

        uint256 payout = 0;
        if (_won) {
            // Odds are scaled by 100. e.g., Amount 100 * Odds 150 / 100 = 150
            payout = (bet.amount * bet.odds) / 100;
            require(bettingToken.transfer(bet.bettor, payout), "Payout failed");
        }

        emit BetSettled(_betId, _won, payout);
    }
    
    // Security function to withdraw house edge/liquidity
    function withdrawLiquidity(uint256 _amount) external onlyOwner {
        bettingToken.transfer(msg.sender, _amount);
    }
}