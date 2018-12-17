pragma solidity ^0.4.24;

import "./ExternalInterfaces/GeneSynthesisInterface.sol";
import "./KydyOwnership.sol";

contract KydySynthesizing is KydyOwnership {

    event Pregnant(address owner, uint256 yinId, uint256 yangId, uint256 cooldownEndBlock);

    uint256 public autoBirthFee = 2 finney;

    uint256 public pregnantKydys;

    GeneSynthesisInterface public geneSynthesis;

    function setGeneSynthesisAddress(address _address) public onlyCEO {
        GeneSynthesisInterface candidateContract = GeneSynthesisInterface(_address);

        require(candidateContract.isGeneSynthesis());

        geneSynthesis = candidateContract;
    }

    function _isReadyToSynthesize(Kydy _kyd) internal view returns (bool) {
        return (_kyd.synthesizingWithId == 0) && (_kyd.cooldownEndBlock <= uint64(block.number));
    }

    function _isSynthesizingPermitted(uint256 _yangId, uint256 _yinId) internal view returns (bool) {
        address yinOwner = kydyIndexToOwner[_yinId];
        address yangOwner = kydyIndexToOwner[_yangId];

        return (yinOwner == yangOwner || synthesizeAllowedToAddress[_yangId] == yinOwner);
    }

    function _triggerCooldown(Kydy storage _kyd) internal {
        _kyd.cooldownEndBlock = uint64((cooldowns[_kyd.cooldownIndex] / secondsPerBlock) + block.number);

        if (_kyd.cooldownIndex < 13) {
            _kyd.cooldownIndex += 1;
        }
    }

    function approveSynthesizing(address _addr, uint256 _yangId)
        public
        whenNotPaused
    {
        require(_owns(msg.sender, _yangId));
        synthesizeAllowedToAddress[_yangId] = _addr;
    }

    function setAutoBirthFee(uint256 val) public onlyCOO {
        autoBirthFee = val;
    }

    function _isReadyToGiveBirth(Kydy _yin) private view returns (bool) {
        return (_yin.synthesizingWithId != 0) && (_yin.cooldownEndBlock <= uint64(block.number));
    }

    function isReadyToSynthesize(uint256 _kydyId)
        public
        view
        returns (bool)
    {
        require(_kydyId > 0);
        Kydy storage kyd = kydys[_kydyId];
        return _isReadyToSynthesize(kyd);
    }

    function _isValidMatingPair(
        Kydy storage _yin,
        uint256 _yinId,
        Kydy storage _yang,
        uint256 _yangId
    )
        private
        view
        returns(bool)
    {
        if (_yinId == _yangId) {
            return false;
        }

        if (_yin.yinId == _yangId || _yin.yangId == _yangId) {
            return false;
        }
        if (_yang.yinId == _yinId || _yang.yangId == _yinId) {
            return false;
        }

        if (_yang.yinId == 0 || _yin.yinId == 0) {
            return true;
        }

        if (_yang.yinId == _yin.yinId || _yang.yinId == _yin.yangId) {
            return false;
        }
        if (_yang.yangId == _yin.yinId || _yang.yangId == _yin.yangId) {
            return false;
        }

        return true;
    }

    function _canSynthesizeWithViaAuction(uint256 _yinId, uint256 _yangId)
        internal
        view
        returns (bool)
    {
        Kydy storage yin = kydys[_yinId];
        Kydy storage yang = kydys[_yangId];
        return _isValidMatingPair(yin, _yinId, yang, _yangId);
    }

    function canSynthesizeWith(uint256 _yinId, uint256 _yangId)
        public
        view
        returns(bool)
    {
        require(_yinId > 0);
        require(_yangId > 0);
        Kydy storage yin = kydys[_yinId];
        Kydy storage yang = kydys[_yangId];
        return _isValidMatingPair(yin, _yinId, yang, _yangId) &&
            _isSynthesizingPermitted(_yangId, _yinId);
    }

    function _synthesizeWith(uint256 _yinId, uint256 _yangId) internal {
        Kydy storage yang = kydys[_yangId];
        Kydy storage yin = kydys[_yinId];

        yin.synthesizingWithId = uint32(_yangId);

        _triggerCooldown(yang);
        _triggerCooldown(yin);

        delete synthesizeAllowedToAddress[_yinId];
        delete synthesizeAllowedToAddress[_yangId];

        pregnantKydys++;

        emit Pregnant(kydyIndexToOwner[_yinId], _yinId, _yangId, yin.cooldownEndBlock);
    }

    function synthesizeWithAuto(uint256 _yinId, uint256 _yangId)
        public
        payable
        whenNotPaused
    {
        require(msg.value >= autoBirthFee);

        require(_owns(msg.sender, _yinId));

        require(_isSynthesizingPermitted(_yangId, _yinId));

        Kydy storage yin = kydys[_yinId];

        require(_isReadyToSynthesize(yin));

        Kydy storage yang = kydys[_yangId];

        require(_isReadyToSynthesize(yang));

        require(_isValidMatingPair(
            yin,
            _yinId,
            yang,
            _yangId
        ));

        _synthesizeWith(_yinId, _yangId);

    }

    function giveBirth(uint256 _yinId)
        public
        whenNotPaused
        returns(uint256)
    {
        Kydy storage yin = kydys[_yinId];

        require(yin.birthTime != 0);

        require(_isReadyToGiveBirth(yin));

        uint256 yangId = yin.synthesizingWithId;
        Kydy storage yang = kydys[yangId];

        uint16 parentGen = yin.generation;
        if (yang.generation > yin.generation) {
            parentGen = yang.generation;
        }

        uint256 childGenes = geneSynthesis.synthGenes(yin.genes, yang.genes);

        address owner = kydyIndexToOwner[_yinId];
        uint256 kydyId = _createKydy(_yinId, yin.synthesizingWithId, parentGen + 1, childGenes, owner);

        delete yin.synthesizingWithId;

        pregnantKydys--;

        // Send the balance fee to the person who made birth happen.
        msg.sender.transfer(autoBirthFee);

        return kydyId;
    }
}
