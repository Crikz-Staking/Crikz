// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./libraries/CrikzMath.sol";
import "./libraries/OrderTypes.sol";
import "./libraries/OrderManager.sol";      
import "./libraries/ProductionDistributor.sol";

contract Crikz is ERC20, ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using CrikzMath for uint256;
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18;
    address public immutable PANCAKESWAP_V2_ROUTER;
    address public lpPair;
    
    OrderTypes.OrderType[7] public orderTypes;
    ProductionDistributor.ProductionFund public productionFund;
    
    mapping(address => OrderManager.Order[]) internal _activeOrders;
    mapping(address => uint256) public totalCreatorReputation; 
    mapping(address => uint256) public creatorYieldDebt;
    mapping(address => uint256) public lastClaimTime;

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
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

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

        // 1. Update the global index
        ProductionDistributor.updateFund(productionFund, block.timestamp);

        // 2. Realize yield for current reputation into debt BEFORE adding new reputation
        creatorYieldDebt[_msgSender()] += (totalCreatorReputation[_msgSender()] * productionFund.accumulatedYieldPerReputation) / CrikzMath.WAD;

        OrderTypes.OrderType memory typeInfo = orderTypes[orderType];
        _transfer(_msgSender(), address(this), amount);

        OrderManager.Order memory newOrder = OrderManager.createOrder(amount, orderType, typeInfo, block.timestamp);
        _activeOrders[_msgSender()].push(newOrder);
        
        // 3. Update totals
        productionFund.totalReputation += newOrder.reputation;
        totalCreatorReputation[_msgSender()] += newOrder.reputation;
        
        // 4. Re-snapshot debt for the NEW total reputation
        // This "zeros out" the historical yield for the newly added stake
        creatorYieldDebt[_msgSender()] = (totalCreatorReputation[_msgSender()] * productionFund.accumulatedYieldPerReputation) / CrikzMath.WAD;
        
        emit OrderCreated(_msgSender(), amount, orderType, block.timestamp);
    }

    function claimYield() external nonReentrant whenNotPaused {
        ProductionDistributor.updateFund(productionFund, block.timestamp);
        address creator = _msgSender();

        uint256 totalProduct = (totalCreatorReputation[creator] * productionFund.accumulatedYieldPerReputation) / CrikzMath.WAD;
        
        // Ensure no underflow if index manipulation occurs in tests
        if (totalProduct <= creatorYieldDebt[creator]) revert ProductionDistributor.NoProductsToClaim();
        
        uint256 pendingYield = totalProduct - creatorYieldDebt[creator];
        
        // CRITICAL SAFETY: Never attempt to transfer more than the pool actually holds
        if (pendingYield > productionFund.balance) {
            pendingYield = productionFund.balance;
        }
        
        if (pendingYield == 0) revert InsufficientFundBalance();
        
        // Realize debt and deduct balance
        creatorYieldDebt[creator] += pendingYield;
        productionFund.balance -= pendingYield;
        
        _transfer(address(this), creator, pendingYield);
        emit YieldClaimed(creator, pendingYield, block.timestamp);
    }

    function completeOrder(uint256 index) external nonReentrant whenNotPaused {
        OrderManager.Order[] storage orders = _activeOrders[_msgSender()];
        if (index >= orders.length) revert InvalidOrderIndex();
        
        OrderManager.Order memory order = orders[index];
        if (block.timestamp < order.startTime + order.duration) revert OrderStillLocked();

        ProductionDistributor.updateFund(productionFund, block.timestamp);

        creatorYieldDebt[_msgSender()] = (totalCreatorReputation[_msgSender()] * productionFund.accumulatedYieldPerReputation) / CrikzMath.WAD;

        productionFund.totalReputation -= order.reputation;
        totalCreatorReputation[_msgSender()] -= order.reputation;
        
        creatorYieldDebt[_msgSender()] = (totalCreatorReputation[_msgSender()] * productionFund.accumulatedYieldPerReputation) / CrikzMath.WAD;

        OrderManager.removeOrder(orders, index);
        _transfer(address(this), _msgSender(), order.amount);
        emit OrderCompleted(_msgSender(), order.amount, order.orderType, block.timestamp);
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

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) { return super._msgSender(); }
    function _contextSuffixLength() internal view virtual override(Context, ERC2771Context) returns (uint256) { return super._contextSuffixLength(); }
    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) { return super._msgData(); }
}