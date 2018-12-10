const KydyCore = artifacts.require('./KydyCoreTest.sol');
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const GeneScience = artifacts.require("./GeneScience.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");

const KAI = require('../lib/basekai.js');

const auto_birth_fee = 50;
const index_of_genes = 9;

contract("Web3Tests", (accounts) => {

  before(async () => {
    ceo = accounts[0];
    coo = accounts[0];
    cfo = accounts[1];

    user1 = accounts[2];
    user2 = accounts[3];
    user3 = accounts[4];

    KC = await KydyCore.new({ from: ceo });
    GR = await GeneRelease.new();

    await KC.setCOO(coo, { from: ceo });
    await KC.setCFO(cfo, { from: ceo });

    const synthesizingAuctionContract = await SynthesizingClockAuction.new(KC.address, 100);
    await KC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address, {
      from: ceo
    });

    const saleAuctionContract = await SaleClockAuction.new(KC.address, 800);
    await KC.setSaleAuctionAddress(saleAuctionContract.address, {
      from: ceo
    });

    const kydyUtilContract = await KydyUtil.new();
    const geneScienceContract = await GeneScience.new(kydyUtilContract.address, GR.address);

    await KC.setGeneScienceAddress(geneScienceContract.address, {
      from: ceo
    });

    await KC.unpause({ from: ceo });

    // breed 10 kydys
    let gene = KAI.decode('1')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('2')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('3')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('4')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('5')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('6')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('7')
    await KC.createPromoKydy(gene, user1);
    gene = KAI.decode('8')
    await KC.createPromoKydy(gene, user2);
    gene = KAI.decode('9')
    await KC.createPromoKydy(gene, user2);
    gene = KAI.decode('a')
    await KC.createPromoKydy(gene, user2);
  })

  describe("tokensOfOwner", function () {

    it("tokensOfOwner successful", async () => {
      const kydys_of_user1 = await KC.tokensOfOwner(user1);
      for (let i = 0; i < 7; i++) {
        const kydy_info = await KC.getKydy(kydys_of_user1[i]);
        assert.equal(kydy_info[index_of_genes].toNumber(), i);
      }

      const kydys_of_user2 = await KC.tokensOfOwner(user2);
      for (let i = 0; i < 3; i++) {
        const kydy_info = await KC.getKydy(kydys_of_user2[i]);
        assert.equal(kydy_info[index_of_genes].toNumber(), i + 7);
      }
    });

    it("tokensOfOwner empty", async () => {
      const kydys_of_user3 = await KC.tokensOfOwner(user3);
      assert.equal(kydys_of_user3.length, 0)
    });
  });

  describe("getReleaseStatus", function () {
    it("getReleaseStatus of initial status", async () => {
      const initial_release = [
        //reserved
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //reserved
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //personality
        1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //wing type
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //horn type
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //eye color
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //eye type
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //pattern color
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //pattern type
        1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //wing & horn color
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //body color
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //body type
        1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ];

      const status = await GR.getReleaseStatus();

      for (let i = 0; i < status.length; i++) {
        assert.equal(initial_release[i], status[i]);
      }
    });
  });
});
