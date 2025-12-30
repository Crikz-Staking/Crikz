// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarketplace is ReentrancyGuard, Ownable {
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
    }

    struct Auction {
        uint256 auctionId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 minPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
    }

    IERC20 public crikzToken;
    uint256 public constant FEE_BPS = 618; // 0.618%
    uint256 public constant BPS_DENOMINATOR = 100000;

    // Storage
    Listing[] public allListings;
    Auction[] public allAuctions;

    // Mappings for quick lookup
    mapping(address => mapping(uint256 => uint256)) public activeListingMap; // contract -> tokenId -> listingIndex
    mapping(address => mapping(uint256 => uint256)) public activeAuctionMap; // contract -> tokenId -> auctionIndex

    // EVENTS (Fixed: Max 3 indexed arguments)
    event ItemListed(uint256 listingId, address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price, uint256 fee);
    event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);
    
    event AuctionCreated(uint256 auctionId, address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 minPrice, uint256 endTime);
    event NewBid(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount, uint256 fee);

    constructor(address _crikzToken) Ownable(msg.sender) {
        crikzToken = IERC20(_crikzToken);
    }

    // --- FIXED PRICE ---

    function listModel(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        // Check if already listed
        require(activeListingMap[nftContract][tokenId] == 0, "Already listed");

        uint256 newId = allListings.length;
        allListings.push(Listing(newId, msg.sender, nftContract, tokenId, price, true));
        
        // Store index + 1 so 0 means "not found"
        activeListingMap[nftContract][tokenId] = newId + 1;

        emit ItemListed(newId, msg.sender, nftContract, tokenId, price);
    }

    function buyItem(uint256 listingId) external nonReentrant {
        require(listingId < allListings.length, "Invalid ID");
        Listing storage listing = allListings[listingId];
        require(listing.isActive, "Item not active");

        listing.isActive = false;
        delete activeListingMap[listing.nftContract][listing.tokenId];

        uint256 fee = (listing.price * FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = listing.price - fee;

        require(crikzToken.transferFrom(msg.sender, owner(), fee), "Fee transfer failed");
        require(crikzToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Seller transfer failed");
        
        IERC721(listing.nftContract).safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        
        emit ItemSold(msg.sender, listing.nftContract, listing.tokenId, listing.price, fee);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        require(listingId < allListings.length, "Invalid ID");
        Listing storage listing = allListings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.isActive, "Not active");

        listing.isActive = false;
        delete activeListingMap[listing.nftContract][listing.tokenId];
        
        emit ItemCanceled(msg.sender, listing.nftContract, listing.tokenId);
    }

    // --- AUCTIONS ---

    function createAuction(address nftContract, uint256 tokenId, uint256 minPrice, uint256 duration) external nonReentrant {
        require(minPrice > 0, "Price > 0");
        require(duration >= 1 minutes, "Duration too short");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        
        // Escrow the NFT
        nft.transferFrom(msg.sender, address(this), tokenId);

        uint256 newId = allAuctions.length;
        allAuctions.push(Auction({
            auctionId: newId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            minPrice: minPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        }));

        activeAuctionMap[nftContract][tokenId] = newId + 1;

        emit AuctionCreated(newId, msg.sender, nftContract, tokenId, minPrice, block.timestamp + duration);
    }

    function bid(uint256 auctionId, uint256 amount) external nonReentrant {
        require(auctionId < allAuctions.length, "Invalid ID");
        Auction storage auction = allAuctions[auctionId];
        
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(amount >= auction.minPrice, "Below min price");
        require(amount > auction.highestBid, "Bid too low");

        // Transfer tokens to contract (Escrow funds)
        require(crikzToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            crikzToken.transfer(auction.highestBidder, auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = amount;

        emit NewBid(auctionId, msg.sender, amount);
    }

    function endAuction(uint256 auctionId) external nonReentrant {
        require(auctionId < allAuctions.length, "Invalid ID");
        Auction storage auction = allAuctions[auctionId];
        
        require(auction.isActive, "Not active");
        require(block.timestamp >= auction.endTime, "Not ended yet");

        auction.isActive = false;
        delete activeAuctionMap[auction.nftContract][auction.tokenId];

        if (auction.highestBidder != address(0)) {
            uint256 fee = (auction.highestBid * FEE_BPS) / BPS_DENOMINATOR;
            uint256 sellerAmount = auction.highestBid - fee;

            // Transfer NFT to winner
            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            // Distribute Funds
            crikzToken.transfer(owner(), fee);
            crikzToken.transfer(auction.seller, sellerAmount);
            
            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid, fee);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0, 0);
        }
    }

    // --- VIEW FUNCTIONS ---

    function getAllListings() external view returns (Listing[] memory) {
        return allListings;
    }

    function getAllAuctions() external view returns (Auction[] memory) {
        return allAuctions;
    }
    
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 count = 0;
        for(uint i=0; i<allListings.length; i++) {
            if(allListings[i].isActive) count++;
        }
        
        Listing[] memory active = new Listing[](count);
        uint256 index = 0;
        for(uint i=0; i<allListings.length; i++) {
            if(allListings[i].isActive) {
                active[index] = allListings[i];
                index++;
            }
        }
        return active;
    }

    function getActiveAuctions() external view returns (Auction[] memory) {
        uint256 count = 0;
        for(uint i=0; i<allAuctions.length; i++) {
            if(allAuctions[i].isActive) count++;
        }
        
        Auction[] memory active = new Auction[](count);
        uint256 index = 0;
        for(uint i=0; i<allAuctions.length; i++) {
            if(allAuctions[i].isActive) {
                active[index] = allAuctions[i];
                index++;
            }
        }
        return active;
    }
}