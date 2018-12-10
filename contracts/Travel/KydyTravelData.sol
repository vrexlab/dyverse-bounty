pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract KydyTravelData is Ownable {

    address private coreAddr;

    uint256 public round;
    uint256 public totalProduction;

    mapping (uint256 => uint256) public travelSeeds;
    mapping (address => uint256) public TTProductionSnapshot;
    mapping (address => uint256) public lastClaimedRound;

    function isKydyTravelData() public pure returns (bool) {
        return true;
    }

    function setNewTravelSeed(uint256 _seed) public onlyOwner {
        round += 1;
        travelSeeds[round] = _seed;
    }

    function setTTProductionOf(address _user, uint256 _production) public onlyOwner {
        TTProductionSnapshot[_user] = _production;
    }

    function setTotalProduction(uint256 _production) public onlyOwner {
        totalProduction = _production;
    }

    function setLastClaimedRound(address _user, uint256 _round) public onlyOwner {
        lastClaimedRound[_user] = _round;
    }
}