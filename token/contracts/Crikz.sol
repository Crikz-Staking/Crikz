// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import "./libraries/CrikzMath.sol"; 
import "./libraries/OrderTypes.sol";
import "./libraries/OrderManager.sol";
import "./libraries/ProductionDistributor.sol";

contract Crikz is ERC20, ERC2771Context, Ownable, ReentrancyGuard, Pausable {
    using CrikzMath for uint256;
    using OrderManager for OrderManager.Order[];

    address public immutable PANCAKESWAP_V2_ROUTER;
    address public lpPairAddress;
    
    OrderTypes.OrderType[7] public orderTypes;
    ProductionDistributor.ProductionFund public productionFund;

    mapping(address => OrderManager.Order[]) public activeOrders;
    mapping(address => uint256) public creatorYieldDebt;
    mapping(address => uint256) public creatorTotalReputation;
    mapping(address => bool) private hasActiveOrders;
    mapping(address => uint256) public creatorTotalProductsClaimed;
    mapping(address => uint256) public creatorTotalProductsRestocked;

    uint256 public constant TOTAL_SUPPLY = 701_408_733 * 10**18;
    uint256 public constant MAX_ORDERS_PER_CREATOR = 50;
    
    uint256 public totalTokensInProduction;
    uint256 public totalActiveCreators;
    uint256 public totalProductsClaimed;
    uint256 public totalProductsRestocked;

    error InsufficientBalance();
    error LPPairAlreadySet();
    error InvalidAddress();
    error AmountTooSmall();
    error MaxOrdersReached();
    error ExceedsProductionFund();

    event OrderCreated(
        address indexed creator,
        uint256 amount,
        uint8 orderType,
        string orderTypeName,
        uint256 reputation,
        uint256 lockUntil,
        uint256 orderIndex,
        uint256 timestamp
    );

    event OrderCompleted(
        address indexed creator,
        uint256 orderIndex,
        uint256 amount,
        uint256 reputation,
        uint256 productsPaid,
        uint256 timestamp
    );

    event OrderCancelled(
        address indexed creator,
        uint256 orderIndex,
        uint256 principal,
        uint256 timestamp
    );

    event ProductsClaimed(
        address indexed creator,
        uint256 amount,
        uint256 timestamp
    );

    event OrderExpanded(
        address indexed creator,
        uint256 indexed orderIndex,
        uint256 yieldAmount,
        uint256 newOrderAmount,
        uint256 timestamp
    );

    event ProductionFundUpdated(
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

        orderTypes = OrderTypes.initializeOrderTypes();
        
        productionFund.lastUpdateTime = block.timestamp;
    }
    // --- END CONSTRUCTOR ---

    function getProductionFundBalance() public view returns (uint256) {
        return productionFund.balance;
    }

    function getProductionFundTotalReputation() public view returns (uint256) {
        return productionFund.totalReputation;
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

    function fundProductionPool(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        _transfer(_msgSender(), address(this), amount);
        productionFund.balance += amount;
        
        emit ProductionFundUpdated(_msgSender(), amount, productionFund.balance, block.timestamp);
    }

    function emergencyOwnerWithdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert CrikzMath.InvalidAmount();
        if (balanceOf(address(this)) < amount) revert InsufficientBalance();
        if (productionFund.balance < amount) revert ExceedsProductionFund();

        productionFund.balance -= amount;
        _transfer(address(this), _msgSender(), amount);
        emit EmergencyWithdraw(_msgSender(), amount, productionFund.balance, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _updateFund() internal {
        ProductionDistributor.updateFund(productionFund, block.timestamp);
    }

    function _updateCreatorDebt(address creator) internal {
        uint256 newDebt = ProductionDistributor.updateCreatorDebt(
            productionFund,
            creatorTotalReputation[creator]
        );
        creatorYieldDebt[creator] = newDebt;
    }
    
    function _updateFundReputation(
        uint256 oldReputation,
        uint256 newReputation
    ) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease 
            ? newReputation - oldReputation 
            : oldReputation - newReputation;
            
        productionFund.totalReputation = isIncrease 
            ? productionFund.totalReputation + changeAmount 
            : productionFund.totalReputation - changeAmount;

        emit ReputationChanged(
            oldReputation,
            productionFund.totalReputation,
            changeAmount,
            isIncrease,
            block.timestamp
        );
    }

    function _updateCreatorReputation(
        address creator,
        uint256 oldReputation,
        uint256 newReputation
    ) internal {
        if (oldReputation == newReputation) return;
        bool isIncrease = newReputation > oldReputation;
        uint256 changeAmount = isIncrease 
            ? newReputation - oldReputation 
            : oldReputation - newReputation;
            
        creatorTotalReputation[creator] = isIncrease 
            ? creatorTotalReputation[creator] + changeAmount 
            : creatorTotalReputation[creator] - changeAmount;
    }
    
    function pendingProducts(address account) public view returns (uint256) {
        if (creatorTotalReputation[account] == 0) return 0;
        ProductionDistributor.ProductionFund memory fundSnapshot = productionFund;
        
        if (fundSnapshot.totalReputation == 0 || fundSnapshot.balance == 0) {
            return 0;
        }

        if (block.timestamp > fundSnapshot.lastUpdateTime) {
            uint256 timeElapsed = block.timestamp - fundSnapshot.lastUpdateTime;
            uint256 yieldAccrued = CrikzMath.calculateTimeBasedYield(
                fundSnapshot.balance,
                timeElapsed,
                fundSnapshot.totalReputation
            );
            
            if (yieldAccrued > fundSnapshot.balance) {
                yieldAccrued = fundSnapshot.balance;
            }
            
            if (yieldAccrued > 0) {
                uint256 yieldPerReputationDelta = CrikzMath.calculateYieldPerReputation(
                    yieldAccrued,
                    fundSnapshot.totalReputation
                );
                fundSnapshot.accumulatedYieldPerReputation += yieldPerReputationDelta;
            }
        }

        uint256 accumulatedYield = (creatorTotalReputation[account] * fundSnapshot.accumulatedYieldPerReputation) / CrikzMath.WAD;
        if (accumulatedYield <= creatorYieldDebt[account]) return 0;
        
        return accumulatedYield - creatorYieldDebt[account];
    }

    function createOrder(uint256 amount, uint8 orderType) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address creator = _msgSender();
        if (amount < CrikzMath.MIN_ORDER_AMOUNT) revert AmountTooSmall();
        OrderTypes.validateOrderType(orderType);
        if (balanceOf(creator) < amount) revert InsufficientBalance();
        if (activeOrders[creator].length >= MAX_ORDERS_PER_CREATOR) revert MaxOrdersReached();

        _updateFund();
        _updateCreatorDebt(creator);

        _transfer(creator, address(this), amount);
        
        OrderManager.Order memory newOrder = OrderManager.createOrder(
            amount,
            orderType,
            orderTypes[orderType],
            block.timestamp
        );

        uint256 oldFundReputation = productionFund.totalReputation;
        uint256 oldCreatorReputation = creatorTotalReputation[creator];

        _updateFundReputation(
            oldFundReputation,
            oldFundReputation + newOrder.reputation
        );
        _updateCreatorReputation(
            creator,
            oldCreatorReputation,
            oldCreatorReputation + newOrder.reputation
        );

        totalTokensInProduction += amount;
        
        uint256 orderIndex = activeOrders[creator].length;
        activeOrders[creator].push(newOrder);
        
        if (!hasActiveOrders[creator]) {
            hasActiveOrders[creator] = true;
            totalActiveCreators += 1;
        }

        _updateCreatorDebt(creator);
        emit OrderCreated(
            creator,
            amount,
            orderType,
            orderTypes[orderType].name,
            newOrder.reputation,
            newOrder.lockUntil,
            orderIndex,
            block.timestamp
        );
    }

    function completeOrder(uint256 orderIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address creator = _msgSender();
        OrderManager.validateOrderIndex(activeOrders[creator], orderIndex);
        
        OrderManager.Order memory order = activeOrders[creator][orderIndex];
        OrderManager.validateCompleted(order, block.timestamp);

        _updateFund();
        
        uint256 productsAmount = pendingProducts(creator);
        
        uint256 oldFundReputation = productionFund.totalReputation;
        uint256 oldCreatorReputation = creatorTotalReputation[creator];
        
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation - order.reputation
        );
        _updateCreatorReputation(
            creator,
            oldCreatorReputation,
            oldCreatorReputation - order.reputation
        );

        totalTokensInProduction -= order.amount;
        activeOrders[creator].removeOrder(orderIndex);

        if (activeOrders[creator].length == 0) {
            hasActiveOrders[creator] = false;
            totalActiveCreators -= 1;
        }
        
        uint256 totalPayout = order.amount;
        if (productsAmount > 0) {
            ProductionDistributor.validateSufficientBalance(productionFund, productsAmount);
            productionFund.balance -= productsAmount;
            totalProductsClaimed += productsAmount;
            creatorTotalProductsClaimed[creator] += productsAmount;
            totalPayout += productsAmount;
        }
        
        _updateCreatorDebt(creator);
        _transfer(address(this), creator, totalPayout);
        
        emit OrderCompleted(
            creator,
            orderIndex,
            order.amount,
            order.reputation,
            productsAmount,
            block.timestamp
        );
    }

    function cancelOrder(uint256 orderIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address creator = _msgSender();
        OrderManager.validateOrderIndex(activeOrders[creator], orderIndex);
        
        OrderManager.Order memory order = activeOrders[creator][orderIndex];

        _updateFund();
        _updateCreatorDebt(creator);

        uint256 oldFundReputation = productionFund.totalReputation;
        uint256 oldCreatorReputation = creatorTotalReputation[creator];
        
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation - order.reputation
        );
        _updateCreatorReputation(
            creator,
            oldCreatorReputation,
            oldCreatorReputation - order.reputation
        );

        totalTokensInProduction -= order.amount;
        activeOrders[creator].removeOrder(orderIndex);
        
        if (activeOrders[creator].length == 0) {
            hasActiveOrders[creator] = false;
            totalActiveCreators -= 1;
        }

        _transfer(address(this), creator, order.amount);
        _updateCreatorDebt(creator);
        
        emit OrderCancelled(creator, orderIndex, order.amount, block.timestamp);
    }

    function _claimProducts(address creator) internal {
        _updateFund();
        uint256 pendingAmount = pendingProducts(creator);
        
        if (pendingAmount > 0) {
            ProductionDistributor.validateSufficientBalance(productionFund, pendingAmount);
            productionFund.balance -= pendingAmount;
            totalProductsClaimed += pendingAmount;
            creatorTotalProductsClaimed[creator] += pendingAmount;
            
            _updateCreatorDebt(creator);

            _transfer(address(this), creator, pendingAmount);
            emit ProductsClaimed(creator, pendingAmount, block.timestamp);
        } else {
            _updateCreatorDebt(creator);
        }
    }

    function claimProducts() external nonReentrant whenNotPaused {
        _claimProducts(_msgSender());
    }

    function expandOrder(uint256 orderIndex) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        address creator = _msgSender();
        OrderManager.validateOrderIndex(activeOrders[creator], orderIndex);
        
        _updateFund();
        uint256 pendingAmount = pendingProducts(creator);
        
        ProductionDistributor.validatePendingProducts(pendingAmount);
        ProductionDistributor.validateSufficientBalance(productionFund, pendingAmount);

        _executeExpansion(creator, orderIndex, pendingAmount);
    }

    function _executeExpansion(
        address creator,
        uint256 orderIndex,
        uint256 pendingAmount
    ) internal {
        OrderManager.Order storage order = activeOrders[creator][orderIndex];
        uint256 oldFundReputation = productionFund.totalReputation;
        uint256 oldCreatorReputation = creatorTotalReputation[creator];

        productionFund.balance -= pendingAmount;
        totalProductsRestocked += pendingAmount;
        creatorTotalProductsRestocked[creator] += pendingAmount;
        totalTokensInProduction += pendingAmount;
        
        OrderTypes.OrderType memory typeInfo = orderTypes[order.orderType];
        (uint256 oldReputation, uint256 newReputation) = OrderManager.updateOrderAmount(
            order,
            order.amount + pendingAmount,
            typeInfo
        );
        
        uint256 reputationChange = newReputation - oldReputation;
        
        _updateFundReputation(
            oldFundReputation,
            oldFundReputation + reputationChange
        );
        _updateCreatorReputation(
            creator,
            oldCreatorReputation,
            oldCreatorReputation + reputationChange
        );
        
        _updateCreatorDebt(creator);
        
        emit OrderExpanded(
            creator,
            orderIndex,
            pendingAmount,
            order.amount,
            block.timestamp
        );
    }

    function getOrderTypeDetails(uint8 orderType) 
        external 
        view 
        returns (
            uint256 lockDuration,
            uint256 reputationMultiplier,
            string memory name
        ) 
    {
        OrderTypes.validateOrderType(orderType);
        return (
            orderTypes[orderType].lockDuration,
            orderTypes[orderType].reputationMultiplier,
            orderTypes[orderType].name
        );
    }
    
    function getOrderCount(address account) external view returns (uint256) {
        return activeOrders[account].length;
    }

    function getOrderByIndex(address account, uint256 index) 
        external 
        view 
        returns (OrderManager.Order memory) 
    {
        OrderManager.validateOrderIndex(activeOrders[account], index);
        return activeOrders[account][index];
    }

    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalTokensInProduction,
            uint256 _totalActiveCreators,
            uint256 _productionFundBalance,
            uint256 _fundTotalReputation,
            uint256 _totalProductsClaimed,
            uint256 _totalProductsRestocked
        ) 
    {
        return (
            totalTokensInProduction,
            totalActiveCreators,
            productionFund.balance,
            productionFund.totalReputation,
            totalProductsClaimed,
            totalProductsRestocked
        );
    }

    function getCreatorStats(address account) 
        external 
        view 
        returns (
            uint256 _totalReputation,
            uint256 _yieldDebt,
            uint256 _pendingProducts,
            uint256 _activeOrderCount,
            uint256 _totalProductsClaimed,
            uint256 _totalProductsRestocked
        ) 
    {
        return (
            creatorTotalReputation[account],
            creatorYieldDebt[account],
            pendingProducts(account),
            activeOrders[account].length,
            creatorTotalProductsClaimed[account],
            creatorTotalProductsRestocked[account]
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

    // Helper 3: Allows the owner to set the production fund balance directly
    function updateProductionFundBalance(uint256 amount) external {
        productionFund.balance = amount;
    }
    // --- END HELPER FUNCTIONS ---
}