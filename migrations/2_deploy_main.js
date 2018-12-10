const GeneSynthesis = artifacts.require("./GeneSynthesis.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");

const KydyCore = artifacts.require("./KydyCore.sol");

const SaleClockAuction = artifacts.require("./Auction/SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./Auction/SynthesizingClockAuction.sol");

module.exports = function(deployer) {
  let UTIL, GR, GS, KC, SALE, SYNTHESIZE
  deployer.then(async () => {
    return deployer.deploy(KydyUtil)
    .then((instKU) => {
      if (instKU) UTIL = instKU
    }).then(() => {
      return deployer.deploy(GeneRelease)
    }).then((instGR) => {
      if (instGR) GR = instGR
    }).then(() => {
      return deployer.deploy(GeneSynthesis, UTIL.address, GR.address)
    }).then((instGS) => {
      if (instGS) GS = instGS
    }).then(() => {
      return deployer.deploy(KydyCore)
    }).then((instKC) => {
      if (instKC) KC = instKC
    }).then(() => {
      return deployer.deploy(SaleClockAuction, KC.address, 500)
    }).then((instSale) => {
      if (instSale) SALE = instSale
    }).then(() => {
      return deployer.deploy(SynthesizingClockAuction, KC.address, 500)
    }).then((instSynth) => {
      if (instSynth) SYNTHESIZE = instSynth
    })
    .then(() => KC.setGeneSynthesisAddress(GS.address))
    .then(() => KC.setSaleAuctionAddress(SALE.address))
    .then(() => KC.setSynthesizingAuctionAddress(SYNTHESIZE.address))
    .then(() => KC.unpause())
  })
}
