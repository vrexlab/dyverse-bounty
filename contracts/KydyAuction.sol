pragma solidity ^0.4.24;

import "./KydyBreeding.sol";
import "./Auction/ClockAuction.sol";
import "./Auction/SynthesizingClockAuction.sol";
import "./Auction/SaleClockAuction.sol";

contract KydyAuction is KydyBreeding {

    SaleClockAuction public saleAuction;

    SynthesizingClockAuction public synthesizingAuction;

    function setSaleAuctionAddress(address _address) public onlyCEO {
        SaleClockAuction candidateContract = SaleClockAuction(_address);

        require(candidateContract.isSaleClockAuction());

        saleAuction = candidateContract;
    }

    function setSynthesizingAuctionAddress(address _address) public onlyCEO {
        SynthesizingClockAuction candidateContract = SynthesizingClockAuction(_address);

        require(candidateContract.isSynthesizingClockAuction());

        synthesizingAuction = candidateContract;
    }

    function createSaleAuction(
        uint256 _kydyId,
        uint256 _price
    )
        public
        whenNotPaused
    {
        require(_owns(msg.sender, _kydyId));
        _approve(_kydyId, saleAuction);
        saleAuction.createAuction(
            _kydyId,
            _price,
            msg.sender
        );
    }

    function createSynthesizingAuction(
        uint256 _kydyId,
        uint256 _price
    )
        public
        whenNotPaused
    {
        require(_owns(msg.sender, _kydyId));
        require(isReadyToBreed(_kydyId));
        _approve(_kydyId, synthesizingAuction);
        synthesizingAuction.createAuction(
            _kydyId,
            _price,
            msg.sender
        );
    }

    function bidOnSynthesizingAuction(
        uint256 _yangId,
        uint256 _yinId
    )
        public
        payable
        whenNotPaused
    {
        require(_owns(msg.sender, _yinId));
        require(isReadyToBreed(_yinId));
        require(_canBreedWithViaAuction(_yinId, _yangId));
        uint256 currPrice = synthesizingAuction.getCurrentPrice(_yangId);

        require (msg.value >= currPrice + autoBirthFee);

        synthesizingAuction.bid.value(msg.value - autoBirthFee)(_yangId);
        _breedWith(uint32(_yinId), uint32(_yangId));
    }

    function withdrawAuctionBalances() external onlyCOO {
        saleAuction.withdrawBalance();
        synthesizingAuction.withdrawBalance();
    }

    function cancelSaleAuction(
        uint256 _kydyId
    )
        public
        whenNotPaused
    {
        require(_owns(saleAuction, _kydyId));
        address _seller = msg.sender;
        _approve(_kydyId, _seller);
        saleAuction.cancelAuction(_kydyId, _seller);
    }

    function cancelSynthesizingAuction(
        uint256 _kydyId
    )
        public
        whenNotPaused
    {
        require(_owns(synthesizingAuction, _kydyId));
        address _seller = msg.sender;
        _approve(_kydyId, _seller);
        synthesizingAuction.cancelAuction(_kydyId, _seller);
    }
}
