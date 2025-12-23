// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./libraries/CrikzMath.sol";
import "./libraries/OrderTypes.sol";
import "./libraries/OrderManager.sol";      
import "./libraries/ProductionDistributor.sol";

contract Crikz is ERC20, ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using CrikzMath for uint256;
    using OrderManager for OrderManager.Order;

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    address public immutable PANCAKESWAP_V2_ROUTER;

    address public lpPair;
    OrderTypes.OrderType[7] public orderTypes;
    ProductionDistributor.ProductionFund public productionFund;

    mapping(address => OrderManager.Order[]) internal _activeOrders;
    mapping(address => uint256) public totalCreatorReputation;
    mapping(address => uint256) public creatorYieldDebt;

    event LPPairSet(address indexed lpPairAddress, uint256 timestamp);
    event OrderCreated(address indexed creator, uint256 amount, uint8 orderType, uint256 timestamp);
    event OrderCompleted(address indexed creator, uint256 amount, uint8 orderType, uint256 timestamp);
    event YieldClaimed(address indexed creator, uint256 amount, uint256 timestamp);

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientOrderType();
    error InsufficientFundBalance();
    error OrderStillLocked();
    error InvalidOrderIndex();

    constructor(address initialForwarder, address routerAddress) 
        ERC20("Crikz Protocol Token", "CRKZ")
        ERC2771Context(initialForwarder)
        Ownable()
    {
        if (routerAddress == address(0)) revert InvalidAddress();
        PANCAKESWAP_V2_ROUTER = routerAddress;
        orderTypes = OrderTypes.initializeOrderTypes();
        _mint(_msgSender(), INITIAL_SUPPLY);
    }
    
    function pause() external onlyOwner { 
        _pause();
    }
    
    function unpause() external onlyOwner { 
        _unpause();
    }

    function setLPPairAddress(address _lpPair) external onlyOwner {
        if (_lpPair == address(0)) revert InvalidAddress();
        lpPair = _lpPair;
        emit LPPairSet(_lpPair, block.timestamp);
    }

    function setProductionFundForTest(uint256 _bal, uint256 _aypr, uint256 _lut, uint256 _tr) external onlyOwner {
        productionFund.balance = _bal;
        productionFund.accumulatedYieldPerReputation = _aypr;
        productionFund.lastUpdateTime = _lut;
        productionFund.totalReputation = _tr;
    }

    function createOrder(uint256 amount, uint8 orderType) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (orderType > OrderTypes.MAX_ORDER_TYPE) revert InsufficientOrderType();

        ProductionDistributor.updateFund(productionFund, block.timestamp);

        address creator = _msgSender();
        uint256 currentReputation = totalCreatorReputation[creator];
        uint256 aypr = productionFund.accumulatedYieldPerReputation;
        creatorYieldDebt[creator] += (currentReputation * aypr) / CrikzMath.WAD;

        OrderTypes.OrderType memory typeInfo = orderTypes[orderType];
        _transfer(creator, address(this), amount);
        
        OrderManager.Order memory newOrder = OrderManager.createOrder(
            amount, 
            orderType, 
            typeInfo, 
            block.timestamp
        );
        _activeOrders[creator].push(newOrder);
        
        uint256 newTotalReputation = currentReputation + newOrder.reputation;
        productionFund.totalReputation += newOrder.reputation;
        totalCreatorReputation[creator] = newTotalReputation;
        
        creatorYieldDebt[creator] = (newTotalReputation * aypr) / CrikzMath.WAD;
        emit OrderCreated(creator, amount, orderType, block.timestamp);
    }

    function claimYield() external nonReentrant whenNotPaused {
        ProductionDistributor.updateFund(productionFund, block.timestamp);
        address creator = _msgSender();

        uint256 aypr = productionFund.accumulatedYieldPerReputation;
        uint256 reputation = totalCreatorReputation[creator];
        uint256 totalProduct = (reputation * aypr) / CrikzMath.WAD;

        if (totalProduct <= creatorYieldDebt[creator]) {
            revert ProductionDistributor.NoProductsToClaim();
        }
        
        uint256 pendingYield = totalProduct - creatorYieldDebt[creator];
        
        // Use Library for coverage
        pendingYield = pendingYield.min(productionFund.balance);
        
        if (pendingYield == 0) revert InsufficientFundBalance();

        creatorYieldDebt[creator] += pendingYield;
        productionFund.balance -= pendingYield;

        _transfer(address(this), creator, pendingYield);
        emit YieldClaimed(creator, pendingYield, block.timestamp);
    }

    function completeOrder(uint256 index) external nonReentrant whenNotPaused {
        OrderManager.Order[] storage orders = _activeOrders[_msgSender()];
        if (index >= orders.length) revert InvalidOrderIndex();
        
        OrderManager.Order memory order = orders[index];
        
        // Use Library for coverage
        if (!order.isUnlocked(block.timestamp)) {
            revert OrderStillLocked();
        }

        ProductionDistributor.updateFund(productionFund, block.timestamp);

        address creator = _msgSender();
        uint256 currentRep = totalCreatorReputation[creator];
        uint256 aypr = productionFund.accumulatedYieldPerReputation;
        uint256 newRep = currentRep - order.reputation;

        productionFund.totalReputation -= order.reputation;
        totalCreatorReputation[creator] = newRep;
        creatorYieldDebt[creator] = (newRep * aypr) / CrikzMath.WAD;

        OrderManager.removeOrder(orders, index);
        _transfer(address(this), creator, order.amount);
        
        emit OrderCompleted(creator, order.amount, order.orderType, block.timestamp);
    }

    function fundProductionPool(uint256 amount) external nonReentrant whenNotPaused {
        _transfer(_msgSender(), address(this), amount);
        ProductionDistributor.updateFund(productionFund, block.timestamp);
        productionFund.balance += amount;
    }

    function getActiveOrders(address creator) external view returns (OrderManager.Order[] memory) {
        return _activeOrders[creator];
    }

    function _transfer(address from, address to, uint256 amount) internal override(ERC20) {
        super._transfer(from, to, amount);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}