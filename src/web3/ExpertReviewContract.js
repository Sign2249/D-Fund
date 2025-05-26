import ExpertReviewArtifact from '../truffle_abis/ExpertReview.json';

const NETWORK_ID = '5777'; // 또는 현재 사용하는 네트워크 ID
const CONTRACT_ADDRESS = ExpertReviewArtifact.networks[NETWORK_ID]?.address;

if (!CONTRACT_ADDRESS) {
  console.warn('🚨 ExpertReview Contract not deployed to network ID', NETWORK_ID);
}

export { CONTRACT_ADDRESS };
