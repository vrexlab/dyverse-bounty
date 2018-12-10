const KydyCore = artifacts.require("./KydyCore.sol");

const KydyTravelToken = artifacts.require("./KydyTravelToken.sol");
const KydyTravelData = artifacts.require("./KydyTravelData.sol");
const KydyTravelConf = artifacts.require("./KydyTravelConf.sol");
const KydyTravelCore = artifacts.require("./KydyTravelCore.sol");

module.exports = function(deployer) {
  let KC, TT, TD, TC, TCore
  deployer.then(async () => {
    return KydyCore.deployed()
    .then((instKC) => {
      if (instKC) KC = instKC
    })
    .then(() => KC.pause())
    .then(() => {
      return deployer.deploy(KydyTravelToken)
    })
    .then((instTT) => {
      if (instTT) TT = instTT
    })
    .then(() => {
      return deployer.deploy(KydyTravelData)
    })
    .then((instTD) => {
      if (instTD) TD = instTD
    })
    .then(() => {
      return deployer.deploy(KydyTravelConf)
    })
    .then((instTC) => {
      if (instTC) TC = instTC
    })
    .then(() => {
      return deployer.deploy(KydyTravelCore)
    })
    .then((instTCore) => {
      if (instTCore) TCore = instTCore
    })
    .then(() => TCore.setToken(TT.address))
    .then(() => TCore.setData(TD.address))
    .then(() => TCore.setConf(TC.address))
    .then(() => TCore.setKydyCore(KC.address))
    .then(() => KC.setTravelCore(TCore.address))
    .then(() => TT.transferOwnership(TCore.address))
    .then(() => TD.transferOwnership(TCore.address))
    .then(() => TC.transferOwnership(TCore.address))
    .then(() => TCore.unfreezeGame())
    .then(() => KC.unpause());
  });
}
