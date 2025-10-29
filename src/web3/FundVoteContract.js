// src/web3/FundVoteContract.js
import FundVoteArtifact from '../truffle_abis/FundVote.json';

const NETWORK_ID = '5777'; // Ganache default
export const CONTRACT_ADDRESS = FundVoteArtifact.networks?.[NETWORK_ID]?.address;
export const FUNDVOTE_ABI = FundVoteArtifact.abi;

if (!CONTRACT_ADDRESS) {
  console.warn('🚨 FundVote contract address undefined. Run `npx truffle migrate --reset`.');
}
