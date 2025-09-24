// Flow Configuration for FlowPonder App
import { config } from '@onflow/fcl'

const flowConfig = {
  // Flow network endpoints
  accessNode: {
    local: 'http://localhost:8888',
    testnet: 'https://rest-testnet.onflow.org',
    mainnet: 'https://rest-mainnet.onflow.org'
  },
  
  // Contract addresses (will be updated after deployment)
  contracts: {
    FlowPonder: {
      testnet: '0x...',
      mainnet: '0x...',
      local: '0xf8d6e0586b0a20c7'
    },
    FlowPonderActions: {
      testnet: '0x...',
      mainnet: '0x...',
      local: '0xf8d6e0586b0a20c7'
    }
  },
  
  // Wallet discovery URLs
  walletDiscovery: {
    testnet: 'https://fcl-discovery.onflow.org/testnet/authn',
    mainnet: 'https://fcl-discovery.onflow.org/authn'
  }
}

// Configure FCL based on environment
export const configureFlow = (network = 'testnet') => {
  const networkConfig = {
    'accessNode.api': flowConfig.accessNode[network],
    'discovery.wallet': flowConfig.walletDiscovery[network] || flowConfig.walletDiscovery.testnet,
    '0xFlowPonder': flowConfig.contracts.FlowPonder[network],
    '0xFlowPonderActions': flowConfig.contracts.FlowPonderActions[network],
    'app.detail.title': 'FlowPonder',
    'app.detail.description': 'Decentralized Prediction Markets on Flow',
    'app.detail.icon': 'https://flowponder.app/icon.png'
  }

  // Apply configuration
  config(networkConfig)
  
  return networkConfig
}

// Contract addresses helper
export const getContractAddress = (contractName, network = 'testnet') => {
  return flowConfig.contracts[contractName]?.[network] || flowConfig.contracts[contractName]?.local
}

// Network configuration
export const FLOW_NETWORKS = {
  LOCAL: 'local',
  TESTNET: 'testnet', 
  MAINNET: 'mainnet'
}

export default flowConfig