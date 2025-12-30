// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
    }

    struct Auction {
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
    
    // Fixed Price Listings
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    // Auctions
    mapping(address => mapping(uint256 => Auction)) public auctions;

    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);
    
    event AuctionCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 minPrice, uint256 endTime);
    event NewBid(address indexed bidder, address indexed nftContract, uint256 indexed tokenId, uint256 amount);
    event AuctionEnded(address indexed winner, address indexed nftContract, uint256 indexed tokenId, uint256 amount);

    constructor(address _crikzToken) {
        crikzToken = IERC20(_crikzToken);
    }

    // --- FIXED PRICE ---

    function listModel(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        
        require(nft.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[nftContract][tokenId] = Listing(msg.sender, nftContract, tokenId, price, true);
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    function buyItem(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isActive, "Item not listed");

        delete listings[nftContract][tokenId];
        require(crikzToken.transferFrom(msg.sender, listing.seller, listing.price), "Token transfer failed");
        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);
        emit ItemSold(msg.sender, nftContract, tokenId, listing.price);
    }

    function cancelListing(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.seller == msg.sender, "Not seller");
        delete listings[nftContract][tokenId];
        emit ItemCanceled(msg.sender, nftContract, tokenId);
    }

    // --- AUCTIONS ---

    function createAuction(address nftContract, uint256 tokenId, uint256 minPrice, uint256 duration) external nonReentrant {
        require(minPrice > 0, "Price > 0");
        require(duration >= 1 minutes, "Duration too short");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        
        // Escrow the NFT
        nft.transferFrom(msg.sender, address(this), tokenId);

        auctions[nftContract][tokenId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            minPrice: minPrice,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        });

        emit AuctionCreated(msg.sender, nftContract, tokenId, minPrice, block.timestamp + duration);
    }

    function bid(address nftContract, uint256 tokenId, uint256 amount) external nonReentrant {
        Auction storage auction = auctions[nftContract][tokenId];
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

        emit NewBid(msg.sender, nftContract, tokenId, amount);
    }

    function endAuction(address nftContract, uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[nftContract][tokenId];
        require(auction.isActive, "Not active");
        require(block.timestamp >= auction.endTime, "Not ended yet");

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner
            IERC721(nftContract).transferFrom(address(this), auction.highestBidder, tokenId);
            // Transfer funds to seller
            crikzToken.transfer(auction.seller, auction.highestBid);
            emit AuctionEnded(auction.highestBidder, nftContract, tokenId, auction.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(nftContract).transferFrom(address(this), auction.seller, tokenId);
            emit AuctionEnded(address(0), nftContract, tokenId, 0);
        }
    }
}