pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

contract KydyTravelToken is MintableToken, PausableToken {

    string public name = "Kydy Travel Token";
    string public symbol = "KYDYTT";
    uint8 public decimals = 0;
    uint public INITIAL_SUPPLY = 0;

    constructor() public {
        pause();
    }

    function isKydyTravelToken() public pure returns (bool) {
        return true;
    }
}