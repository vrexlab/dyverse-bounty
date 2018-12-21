pragma solidity ^0.4.24;

import "./../ERC721Standard/ERC721Basic.sol";
import "./../ERC721Standard/ERC721Holder.sol";
import "./../math/SafeMath.sol";

contract ClockAuctionBase is ERC721Holder {
    using SafeMath for uint256;

    struct Auction {
        address seller;
        uint128 price;
        uint64 startedAt;
    }

    ERC721Basic public nonFungibleContract;

    uint256 public ownerCut;

    mapping (uint256 => Auction) tokenIdToAuction;

    event AuctionCreated(uint256 tokenId, uint256 price);
    event AuctionSuccessful(uint256 tokenId, uint256 totalPrice, address winner);
    event AuctionCancelled(uint256 tokenId);

    function() external {}

    modifier canBeStoredWith64Bits(uint256 _value) {
        require(_value <= (2**64 - 1));
        _;
    }

    modifier canBeStoredWith128Bits(uint256 _value) {
        require(_value < (2**128 - 1));
        _;
    }

    function _owns(address _claimant, uint256 _tokenId) internal view returns (bool) {
        return (nonFungibleContract.ownerOf(_tokenId) == _claimant);
    }

    function _escrow(address _owner, uint256 _tokenId) internal {
        nonFungibleContract.safeTransferFrom(_owner, this, _tokenId);
    }

    function _transfer(address _receiver, uint256 _tokenId) internal {
        nonFungibleContract.safeTransferFrom(this, _receiver, _tokenId);
    }

    function _addAuction(uint256 _tokenId, Auction _auction) internal {
        tokenIdToAuction[_tokenId] = _auction;

        emit AuctionCreated(
            uint256(_tokenId),
            uint256(_auction.price)
        );
    }

    function _cancelAuction(uint256 _tokenId, address _seller) internal {
        _removeAuction(_tokenId);
        _transfer(_seller, _tokenId);
        emit AuctionCancelled(_tokenId);
    }

    function _bid(uint256 _tokenId, uint256 _bidAmount)
        internal
        returns (uint256)
    {
        Auction storage auction = tokenIdToAuction[_tokenId];

        require(_isOnAuction(auction));

        uint256 price = _currentPrice(auction);
        require(_bidAmount == price);

        address seller = auction.seller;

        _removeAuction(_tokenId);

        if (price > 0) {
            uint256 auctioneerCut = _computeCut(price);
            uint256 sellerProceeds = price.sub(auctioneerCut);

            seller.transfer(sellerProceeds);
        }

        emit AuctionSuccessful(_tokenId, price, msg.sender);

        return price;
    }

    function _removeAuction(uint256 _tokenId) internal {
        delete tokenIdToAuction[_tokenId];
    }

    function _isOnAuction(Auction storage _auction) internal view returns (bool) {
        return (_auction.startedAt > 0);
    }

    function _currentPrice(Auction storage _auction)
        internal
        view
        returns (uint256)
    {
        return _auction.price;
    }

    function _computeCut(uint256 _price) internal view returns (uint256) {
        return _price.mul(ownerCut).div(10000);
    }

}
