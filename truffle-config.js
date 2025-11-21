require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*'
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        [process.env.PRIVATE_KEY],        // ✅ 배열로 감싸기
        process.env.ALCHEMY_URL
      ),
      network_id: 11155111,
        gas: 10000000,           // 🔼 기존보다 2배로 증가
        gasPrice: 10000000000,  // 10 gwei 유지

      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/truffle_abis',

  compilers: {
    solc: {
      version: '0.8.19',
      optimizer: { enabled: true, runs: 200 }
    }
  }
};
