// https://eth-rinkeby.alchemyapi.io/v2/WntML0La4k9zkrMlonXJXIidEillHDaA

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/WntML0La4k9zkrMlonXJXIidEillHDaA",
      accounts: [
        "1a268090496a24dffa87d5f3c2b1d93294da72547e955a302b253a767a38f300",
      ],
    },
  },
};
