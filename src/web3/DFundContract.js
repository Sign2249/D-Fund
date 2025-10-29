import DFundCoreArtifact from '../truffle_abis/DFundCore.json';

const NETWORK_ID = '5777';
export const CONTRACT_ADDRESS = DFundCoreArtifact.networks[NETWORK_ID]?.address;
export const DFundCoreABI = DFundCoreArtifact.abi;
