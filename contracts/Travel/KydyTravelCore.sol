pragma solidity 0.4.24;

import "./KydyTravelConf.sol";
import "./KydyTravelToken.sol";
import "./KydyTravelData.sol";
import "../KydyAccessControl.sol";
import "./KydyTravelInterface.sol";

contract KydyTravelCore is KydyAccessControl, KydyTravelInterface {
    using SafeMath for uint256;

    address public kydyCore;

    KydyTravelToken public token;
    KydyTravelConf public conf;
    KydyTravelData public data;

    modifier onlyKydyCore() {
        require(msg.sender == kydyCore, "only KydyCore contract can call");
        _;
    }

    constructor() public {
        paused = true;

        ceoAddress = msg.sender;
        cooAddress = msg.sender;
        cfoAddress = msg.sender;
    }

    // Management functions
    function setKydyCore(address _newKydyCore) public onlyCEO whenPaused {
        kydyCore = _newKydyCore;
    }
    
    function setToken(address _newToken) public onlyCEO whenPaused {
        token = KydyTravelToken(_newToken);
        require(token.isKydyTravelToken(), "Not a valid token contract");
    }

    function setConf(address _newConf) public onlyCEO whenPaused {
        conf = KydyTravelConf(_newConf);
        require(conf.isKydyTravelConf(), "Not a valid conf contract");
    }

    function setData(address _newData) public onlyCEO whenPaused {
        data = KydyTravelData(_newData);
        require(data.isKydyTravelData(), "Not a valid data contract");
    }

    // I know using number is not a good way to implement RNG.
    // However, until travelSeed doesn't affect any monetary stuff,
    // we can keep this simple seed.
    // Replace it when needed.
    function newTravelRound() public onlyCOO {
        uint256 round = data.round();
        data.setNewTravelSeed(uint256(blockhash(block.number - 1)) * round);
    }
    
    function freezeGame() public onlyCEO {
        token.pause();
        paused = true;
    }

    function unfreezeGame() public onlyCEO {
        require (token != address(0), "Should set token contract");
        require (conf != address(0), "Should set conf contract");
        require (data != address(0), "Should set data contract");

        token.unpause();
        paused = false;
    }

    // User functions
    function claimTravelToken() public {
        mintAndTransferTT(msg.sender);
    }

    function balanceOfUnclaimedTT(address _user) public view returns (uint256) {
        uint256 currentRound = data.round();
        uint256 lastClaimedRound = data.lastClaimedRound(_user);
        uint256 production = getProductionOf(_user);

        return currentRound.sub(lastClaimedRound).mul(production);
    }

    function getRound() public view returns (uint256) {
        return data.round();
    }

    function getTravelSeed(uint256 _round) public view returns (uint256) {
        return data.travelSeeds(_round);
    }

    function getProductionOf(address _user) public view returns (uint256) {
        return data.TTProductionSnapshot(_user);
    }

    function getTokenBalanceOf(address _user) public view returns (uint256) {
        return token.balanceOf(_user);
    }

    function transferTTProduction(address _from, address _to, uint256 _kydyId) public onlyKydyCore {
        uint256 production = calcProductionOfKydy(_kydyId);
        uint256 currentTotalProd = data.totalProduction();

        mintAndTransferTT(_to);
        mintAndTransferTT(_from);

        if (_from != address(0)) {
            uint256 currentFromProd = data.TTProductionSnapshot(_from);
            data.setTTProductionOf(_from, currentFromProd - production);
            data.setTotalProduction(currentTotalProd - production);
        }
        uint256 currentToProd = data.TTProductionSnapshot(_to);
        data.setTTProductionOf(_to, currentToProd + production);
        data.setTotalProduction(currentTotalProd + production);
    }

    function mintAndTransferTT(address _user) internal {
        uint256 claimable = balanceOfUnclaimedTT(_user);
        if(claimable == 0) return;

        token.mint(_user, claimable);

        uint256 currentRound = data.round();
        data.setLastClaimedRound(_user, currentRound);
    }

    // TODO(): temporary fix for compile error
    // function calcProductionOfKydy(uint256 _kydyId) internal view returns (uint256) {
    function calcProductionOfKydy(uint256 _kydyId) internal pure returns (uint256) {
        _kydyId;
        return 1;
    }

}