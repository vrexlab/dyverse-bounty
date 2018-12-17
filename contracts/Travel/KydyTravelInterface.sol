pragma solidity 0.4.24;

contract KydyTravelInterface {
    function balanceOfUnclaimedTT(address _user) public view returns(uint256);
    function transferTTProduction(address _from, address _to, uint256 _kydyId) public;
    function getProductionOf(address _user) public view returns (uint256);
}