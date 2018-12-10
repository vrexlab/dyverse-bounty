var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "";

module.exports = {
	networks: {
		development: { // main development environment is Ganache
			host: "127.0.0.1",
			port: 7545,
			network_id: "*" // Match any network id
		},
		ropsten: {
			provider: function() {
				return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/461bbbb13969418bb95a1297c8ddc25f", 0);
			},
			network_id: 3
		},
		rinkeby: {
			provider: function() {
				return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/461bbbb13969418bb95a1297c8ddc25f", 0);
			},
			network_id: 4
		}
	}
};
