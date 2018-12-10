# On the Dyverse & its architecture:

Dyverse is composed of 4 contracts. Details are as follows:

##### KydyCore.sol - `0x1ba1d1f338bd0a0dab0d1fe7fe72d268c3b2ae05` - rinkeby

This contract holds most of our main features. Ownership info about Kydys are stored, and it also defines how creation of Gen 0 Kydys, synthesis between two Kydys and transfer of ownership takes place within the Dyverse. We will refer to this contact as the <i>Main</i>. 

##### SaleClockAuction.sol - `0x205050ebd98452f2b5d6a4e3a1e85d1790d51666` - rinkeby

This essentially defines how our marketplace works. Owners can purchase Gen 0 Kydy via auction, and also sell the Kydys they own. A owner can cancel their Kydy on sale any time before its sale is complete. 

We are noticeably different from other DApps in that we do not support a Dutch auction. We will be working to provide a better sales mechanism in the near future that does not require a Dutch auction. 

##### SynthesizingClockAuction.sol - `0x4740f93bb119c45cba93022f6eaa97d276d5c2ce` - rinkeby

Synthesis (breeding) can take place between either 1) two of the owner's own Kydys or 2) with another user's Kydy. This contract defines how an owner can breed with another user's Kydy via auction in the Market.

##### GeneSynthesis.sol

This contract defines how a child Kydy is created via a mysterious process called the <i>Synthesis</i>. To make the process more fun, this contract will be kept hidden, but smart players will be able to figure out how it works :wink:

## Synthesis

- You need two Kydys to synthesize their energy and create a child Kydy. 
- Every Kydy is genderless. 
- They either send Yang energy as a father or synthesize the Yang energy with its Yin energy as the mother. 
- The Yin Kydy creates the child Kydy, after its recharge period expires. Yin cannot engage in any other synthesis during its recharge period. 
- The Yang Kydy also cannot engage in any other synthesis during its recharge period. 
- Kydys cannot synthesize energy with its siblings or family members. 
- A Kydy's recharge period increases after every synthesis.
- A newly created child Kydy can engage in a synthesis right after its birth.
- The recharge time table can be found under `KydyBase.sol`.
- Owners can perform a synthesis either between its own unrelated Kydys or send the Yang energy to another user's Yin Kydy, if approved. In the latter, the owner of the Yang Kydy may receive a specified fee while the owner of the Yin Kydy owns the newly created child Kydy. 

## Transfer ownership

The owner may transfer ownership by either 1) putting up their Kydy for a sale in our market where we act as an escrow, or 2) directly transferring the Kydy to another wallet address. 

# What users can do (main functions)

- user can buy Kydys (Sale Auction `bid()`) 
- user can transfer their own Kydy to another user (Main `transfer()`)
- user can approve another user to take ownership of their own Kydy (Main `approve()`)
- after approval, the new owner can claim a Kydy (Main `transferFrom()`)
- user can get Kydy data (Main `getKydy()`)
- user can get info of a Kydy that is on the auction (Sale/Synthesizing Auction `getAuction()`)
- user can synthesize two of their own Kydys (Main `breedWith()` or `breedWithAuto()`)
- any one can create the child Kydy by calling this function, after the recharge period is expired (Main `giveBirth()`)
- user can put up their Kydy as the Yang Kydy on auction for a fee (Main `createSynthesizingAuction()`)
- user can also just approve using their Kydy as the Yang Kydy to another user (Main `approveSynthesizing()`)
- user can sell their Kydy via auction (Main `createSaleAuction()`)
- user can cancel a sale of their own Kydy (Sale/Synthesizing Auction `cancelAuction()`)

## Members of the Dyverse Team's permitted activities

- CEO has the authority to replace COO or CFO (Main `setCEO()` `setCFO()` `setCOO()`)
- COO periodically puts a Gen 0 Kydy on auction (Main `createGen0Auction()`)
- COO can create and transfer promotional Kydys (Main `createPromoKydy()`)
- COO can transfer the balance from auctions (Main `withdrawAuctionBalances()`)
- CFO can withdraw funds from the main contract (Main `withdrawBalance()`)

Please see details in the `KydyAccessControl.sol` contract.

## Testing

- The only pre-dependency is **Node 8.11.4** - the best way to install node is via [nvm](https://github.com/creationix/nvm)
- We use [Truffle 4 framework to develop](http://truffleframework.com/docs/), all dependencies are installed via `npm install`
- Run the the test suite: `npm test`

If there is any question or comment, please email us at support@vrexlab.com 









