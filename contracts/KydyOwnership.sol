pragma solidity ^0.4.24;

import "./KydyBase.sol";
import "./ERC721Draft.sol";

contract KydyOwnership is KydyBase, ERC721 {

    string public name = "Dyverse";
    string public symbol = "KYDY";

    function implementsERC721() public pure returns (bool)
    {
        return true;
    }

    function _owns(address _claimant, uint256 _tokenId) internal view returns (bool) {
        return kydyIndexToOwner[_tokenId] == _claimant;
    }

    function _approvedFor(address _claimant, uint256 _tokenId) internal view returns (bool) {
        return kydyIndexToApproved[_tokenId] == _claimant;
    }

    function _approve(uint256 _tokenId, address _approved) internal {
        kydyIndexToApproved[_tokenId] = _approved;
    }

    function rescueLostKydy(uint256 _kydyId, address _recipient) public onlyCOO whenNotPaused {
        require(_owns(this, _kydyId));
        _transfer(this, _recipient, _kydyId);
    }

    function balanceOf(address _owner) public view returns (uint256 count) {
        return ownershipTokenCount[_owner];
    }

    function transfer(
        address _to,
        uint256 _tokenId
    )
        public
        whenNotPaused
    {
        require(_to != address(0));
        require(_owns(msg.sender, _tokenId));

        _transfer(msg.sender, _to, _tokenId);
    }

    function approve(
        address _to,
        uint256 _tokenId
    )
        public
        whenNotPaused
    {
        require(_owns(msg.sender, _tokenId));

        _approve(_tokenId, _to);

        emit Approval(msg.sender, _to, _tokenId);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    )
        public
        whenNotPaused
    {
        require(_approvedFor(msg.sender, _tokenId));
        require(_owns(_from, _tokenId));

        _transfer(_from, _to, _tokenId);
    }

    function totalSupply() public view returns (uint) {
        return kydys.length - 1;
    }

    function ownerOf(uint256 _tokenId)
        public
        view
        returns (address owner)
    {
        owner = kydyIndexToOwner[_tokenId];

        require(owner != address(0));
    }

    // Never call this function in smart contract. It's only for web3.
    function tokensOfOwner(address _owner) external view returns(uint256[] ownerTokens) {
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 totalKydys = totalSupply();
            uint256 resultIndex = 0;

            // All kydys have IDs starting at 1 and increasing sequentially up to the totalKydy count.
            uint256 kydyId;

            for (kydyId = 1; kydyId <= totalKydys; kydyId++) {
                if (kydyIndexToOwner[kydyId] == _owner) {
                    result[resultIndex] = kydyId;
                    resultIndex++;
                }
            }

            return result;
        }
    }
}
