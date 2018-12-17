pragma solidity ^0.4.24;

import "./KydyAuction.sol";

contract KydyMinting is KydyAuction {

    uint256 public promoCreationLimit = 888;
    uint256 public gen0CreationLimit = 8888;

    uint256 public gen0StartingPrice = 10 finney;

    uint256 public promoCreatedCount;
    uint256 public gen0CreatedCount;

    function createPromoKydy(uint256 _genes, address _owner) public onlyCOO {
        if (_owner == address(0)) {
             _owner = cooAddress;
        }
        require(promoCreatedCount < promoCreationLimit);
        require(gen0CreatedCount < gen0CreationLimit);

        promoCreatedCount++;
        gen0CreatedCount++;
        _createKydy(0, 0, 0, _genes, _owner);
    }

    function createGen0Auction(uint256 _genes) public onlyCOO {
        require(gen0CreatedCount < gen0CreationLimit);

        uint256 kydyId = _createKydy(0, 0, 0, _genes, address(this));
        _approve(kydyId, saleAuction);

        saleAuction.createAuction(
            kydyId,
            _computeNextGen0Price(),
            address(this)
        );

        gen0CreatedCount++;
    }

    function _computeNextGen0Price() internal view returns (uint256) {
        uint256 avePrice = saleAuction.averageGen0SalePrice();

        // Sanity check to ensure we don't overflow arithmetic
        require(avePrice == uint256(uint128(avePrice)));

        uint256 nextPrice = avePrice + (avePrice / 2);

        if (nextPrice < gen0StartingPrice) {
            nextPrice = gen0StartingPrice;
        }

        return nextPrice;
    }
}
