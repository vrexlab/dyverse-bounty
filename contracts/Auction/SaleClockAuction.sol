pragma solidity ^0.4.24;

import "./ClockAuction.sol";

contract SaleClockAuction is ClockAuction {

    bool public isSaleClockAuction = true;

    uint256 public gen0SaleCount;
    uint256[5] public lastGen0SalePrices;

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
        address seller = tokenIdToAuction[_tokenId].seller;
        uint256 price = _bid(_tokenId, msg.value);
        _transfer(msg.sender, _tokenId);

        // TODO(santony): check if this is feasible
        if (seller == address(nonFungibleContract)) {
            lastGen0SalePrices[gen0SaleCount % 5] = price;
            gen0SaleCount++;
        }
    }

    function averageGen0SalePrice() public view returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < 5; i++) {
            sum += lastGen0SalePrices[i];
        }
        return sum / 5;
    }

}
