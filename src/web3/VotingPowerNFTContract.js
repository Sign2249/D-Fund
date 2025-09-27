import VotingPowerNFTArtifact from '../truffle_abis/VotingPowerNFT.json';

// truffle migrate --reset할 때마다 변경되는 계약 주소를 자동으로 추출
const NETWORK_ID = '5777'; // Ganache or your current network ID
const CONTRACT_ADDRESS = VotingPowerNFTArtifact.networks[NETWORK_ID]?.address;

if (!CONTRACT_ADDRESS) {
  console.warn('🚨 VotingPowerNFTArtifact Contract not deployed to network ID', NETWORK_ID);
}

export { CONTRACT_ADDRESS };
