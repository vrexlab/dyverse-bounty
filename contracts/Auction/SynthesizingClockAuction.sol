pragma solidity ^0.4.24;

import "./ClockAuction.sol";

contract SynthesizingClockAuction is ClockAuction {

    bool public isSynthesizingClockAuction = true;

    constructor(address _nftAddr, uint256 _cut) public
        ClockAuction(_nftAddr, _cut) {}

    function createAuction(
        uint256 _tokenId,
        uint256 _price,
        address _seller
    )
        public
        canBeStoredWith128Bits(_price)
    {
        require(msg.sender == address(nonFungibleContract));
        _escrow(_seller, _tokenId);
        Auction memory auction = Auction(
            _seller,
            uint128(_price),
            uint64(now)
        );
        _addAuction(_tokenId, auction);
    }

    function bid(uint256 _tokenId)
        public
        payable
    {
        require(msg.sender == address(nonFungibleContract));
        address seller = tokenIdToAuction[_tokenId].seller;
        _bid(_tokenId, msg.value);
        _transfer(seller, _tokenId);
    }

}
