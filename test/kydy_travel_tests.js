const KydyCore = artifacts.require('./KydyCore.sol');
const SaleClockAuction = artifacts.require("./SaleClockAuction.sol");
const SynthesizingClockAuction = artifacts.require("./SynthesizingClockAuction.sol");
const GeneScience = artifacts.require("./GeneScience.sol");
const GeneRelease = artifacts.require("./GeneRelease.sol");
const KydyUtil = artifacts.require("./KydyUtil.sol");

const KydyTravelToken = artifacts.require('./KydyTravelToken.sol');
const KydyTravelData = artifacts.require('./KydyTravelData.sol');
const KydyTravelConf = artifacts.require('./KydyTravelConf.sol');
const KydyTravelCore = artifacts.require('./KydyTravelCore.sol');

const util = require("./util.js");

contract("KydyTravel", (accounts) => {
  const eq = assert.equal.bind(assert);

  before(async () => {
    ceo = accounts[0];
    coo = accounts[0];
    cfo = accounts[0];

    userA = accounts[1];
    userB = accounts[2];
    userC = accounts[3];

    // Setting up KydyCore
    KC = await KydyCore.new({ from: ceo });

    await KC.setCOO(coo, { from: ceo });
    await KC.setCFO(cfo, { from: ceo });

    const synthesizingAuctionContract = await SynthesizingClockAuction.new(KC.address, 100);
    await KC.setSynthesizingAuctionAddress(synthesizingAuctionContract.address);

    const saleAuctionContract = await SaleClockAuction.new(KC.address, 800);
    await KC.setSaleAuctionAddress(saleAuctionContract.address);

    const kydyUtilContract = await KydyUtil.new();
    const geneReleaseContract = await GeneRelease.new();
    const geneScienceContract = await GeneScience.new(kydyUtilContract.address, geneReleaseContract.address);

    await KC.setGeneScienceAddress(geneScienceContract.address);

    // Setting up KydyTravelCore
    Token = await KydyTravelToken.new();
    Data = await KydyTravelData.new();
    Conf = await KydyTravelConf.new();

    KT = await KydyTravelCore.new();

    await Token.transferOwnership(KT.address);
    await Data.transferOwnership(KT.address);
    await Conf.transferOwnership(KT.address);

    await KT.setToken(Token.address);
    await KT.setData(Data.address);
    await KT.setConf(Conf.address);

    await KT.setKydyCore(KC.address);

    await KT.unfreezeGame();

    await KC.setTravelCore(KT.address);
    await KC.unpause();

    await KC.createPromoKydy(1, userA);
    await KC.createPromoKydy(2, userA);
    await KC.createPromoKydy(3, userA);
    await KC.createPromoKydy(4, userA);
    await KC.createPromoKydy(5, userA);
  })

  describe("KydyTravelToken", function () {

    it("is KydyTravelToken", async () => {
      const ret = await Token.isKydyTravelToken();
      assert.equal(ret, true);
    });

    it("Disallow illegal token mint", async () => {
      await util.expectThrow(Token.mint(ceo, 10, {from: ceo }));
    });

    it("Allow token mint through Claiming", async () => {
      await KT.newTravelRound();

      const token_supply_first = await Token.totalSupply();
      
      await KT.claimTravelToken({from: userA});
      const token_supply_last = await Token.totalSupply();

      assert.equal(token_supply_last.toNumber(), token_supply_first.add(5).toNumber());
    });
  });

  describe("KydyTravelCore", function () {

    it("Get round of current travel", async () => {
      const round = await KT.getRound();
      assert.equal(round, 1);
    });

    it("Start new round of travel", async () => {
      const first_round = await KT.getRound();
      const first_seed = await KT.getTravelSeed(first_round);

      await KT.newTravelRound();

      const second_round = await KT.getRound();
      const second_seed = await KT.getTravelSeed(second_round);

      assert.equal(second_round.toNumber(), first_round.toNumber() + 1, "wrong round");
      assert.notEqual(second_seed.toNumber(), first_seed.toNumber(), "seed not generated");
    });

    it("Get production of User A", async() => {
      const estimatedProd = 5;
      const prod = await KT.getProductionOf(userA);
      
      assert.equal(prod, estimatedProd);
    });

    it("Increase production of User A", async() => {
      // Increase
      await KC.createPromoKydy(6, userA);

      // Get
      const estimatedProd = 6;
      const prod = await KT.getProductionOf(userA);
      
      assert.equal(prod, estimatedProd);
    });

    it("Decrease production of User A by creating an auction", async() => {
      // Decrease
      await KC.createSaleAuction(6, "100", { from: userA });

      // Get
      const estimatedProd = 5;
      const prod = await KT.getProductionOf(userA);
      
      assert.equal(prod, estimatedProd);
    });

    it("Get balance of unclaimed TravelToken", async () => {
      // Get
      const prod = await KT.getProductionOf(userA);
      const pre = await KT.balanceOfUnclaimedTT(userA);
      
      // New round
      await KT.newTravelRound();

      // Get
      const post = await KT.balanceOfUnclaimedTT(userA);
      assert.equal(post.toNumber(), pre.add(prod).toNumber());
    });

    it("Claim TravelToken and get token balance", async () => {
      const pre_unclaimed = await KT.balanceOfUnclaimedTT(userA);
      const pre_balance = await KT.getTokenBalanceOf(userA);
      assert.equal(pre_unclaimed.toNumber(), 5);

      KT.claimTravelToken({ from: userA });
      
      const post_unclaimed = await KT.balanceOfUnclaimedTT(userA);
      const post_balance = await KT.getTokenBalanceOf(userA);

      assert.equal(post_unclaimed.toNumber(), 0);
      assert.equal(post_balance.toNumber(), pre_balance.add(pre_unclaimed).toNumber());
    });

    it("Freeze game", async () => {
      await KT.freezeGame();
    });

    it("Unfreeze game", async () => {
      await KT.unfreezeGame();
    });
  });

  describe("KydyTravelData", function () {

  }); 
});
