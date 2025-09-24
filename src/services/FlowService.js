// Flow Service - Main interface for blockchain interactions
import * as fcl from '@onflow/fcl'
import { getContractAddress } from '../config/flow'

class FlowService {
  constructor() {
    this.isInitialized = false
    this.currentUser = null
  }

  // Initialize Flow service
  async initialize(network = 'testnet') {
    try {
      const { configureFlow } = await import('../config/flow')
      configureFlow(network)
      this.isInitialized = true
      console.log('Flow service initialized for network:', network)
    } catch (error) {
      console.error('Failed to initialize Flow service:', error)
      throw error
    }
  }

  // Authenticate user with wallet
  async authenticate() {
    try {
      const user = await fcl.logIn()
      this.currentUser = user
      return user
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  // Sign out user
  async signOut() {
    try {
      await fcl.unauthenticate()
      this.currentUser = null
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const user = await fcl.currentUser.snapshot()
      this.currentUser = user
      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  // Create a new ponder
  async createPonder({
    question,
    description,
    options,
    durationHours,
    minBet,
    maxBet,
    category
  }) {
    const transaction = `
      import FlowPonder from ${getContractAddress('FlowPonder')}
      import FlowToken from 0x7e60df042a9c0868

      transaction(
        question: String,
        description: String,
        options: [String],
        durationHours: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        category: String
      ) {
        let ponderManager: &FlowPonder.PonderManager
        let flowVault: &FlowToken.Vault

        prepare(signer: AuthAccount) {
          // Get or create PonderManager
          if signer.borrow<&FlowPonder.PonderManager>(from: FlowPonder.PonderStoragePath) == nil {
            let manager <- FlowPonder.createPonderManager()
            signer.save(<-manager, to: FlowPonder.PonderStoragePath)
            signer.link<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>(
              FlowPonder.PonderPublicPath,
              target: FlowPonder.PonderStoragePath
            )
          }

          self.ponderManager = signer.borrow<&FlowPonder.PonderManager>(
            from: FlowPonder.PonderStoragePath
          ) ?? panic("Could not borrow PonderManager")

          self.flowVault = signer.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow FlowToken vault")
        }

        execute {
          let payment <- self.flowVault.withdraw(amount: 1.0)

          let ponderId = self.ponderManager.createPonder(
            question: question,
            description: description,
            options: options,
            durationHours: durationHours,
            minBet: minBet,
            maxBet: maxBet,
            category: category,
            payment: <-payment
          )

          log("Created ponder with ID: ".concat(ponderId.toString()))
        }
      }
    `

    try {
      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(question, t.String),
          arg(description, t.String),
          arg(options, t.Array(t.String)),
          arg(durationHours.toFixed(1), t.UFix64),
          arg(minBet.toFixed(1), t.UFix64),
          arg(maxBet.toFixed(1), t.UFix64),
          arg(category, t.String)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      })

      const result = await fcl.tx(transactionId).onceSealed()
      return { success: true, transactionId, result }
    } catch (error) {
      console.error('Create ponder failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Place a vote on a ponder
  async placeVote(ponderId, option, amount) {
    const transaction = `
      import FlowPonder from ${getContractAddress('FlowPonder')}
      import FlowToken from 0x7e60df042a9c0868

      transaction(ponderId: UInt64, option: UInt8, amount: UFix64) {
        let ponderManager: &FlowPonder.PonderManager
        let flowVault: &FlowToken.Vault

        prepare(signer: AuthAccount) {
          self.ponderManager = signer.borrow<&FlowPonder.PonderManager>(
            from: FlowPonder.PonderStoragePath
          ) ?? panic("Could not borrow PonderManager")

          self.flowVault = signer.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow FlowToken vault")
        }

        execute {
          let payment <- self.flowVault.withdraw(amount: amount)

          self.ponderManager.placeVote(
            ponderId: ponderId,
            option: option,
            payment: <-payment
          )

          log("Vote placed on ponder ".concat(ponderId.toString()))
        }
      }
    `

    try {
      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(ponderId.toString(), t.UInt64),
          arg(option.toString(), t.UInt8),
          arg(amount.toFixed(1), t.UFix64)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      })

      const result = await fcl.tx(transactionId).onceSealed()
      return { success: true, transactionId, result }
    } catch (error) {
      console.error('Place vote failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Place a free vote (no payment)
  async placeFreeVote(ponderId, option) {
    const transaction = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      transaction(ponderId: UInt64, option: UInt8) {
        let ponderManager: &FlowPonder.PonderManager

        prepare(signer: AuthAccount) {
          self.ponderManager = signer.borrow<&FlowPonder.PonderManager>(
            from: FlowPonder.PonderStoragePath
          ) ?? panic("Could not borrow PonderManager")
        }

        execute {
          self.ponderManager.placeVote(
            ponderId: ponderId,
            option: option,
            payment: nil
          )

          log("Free vote placed on ponder ".concat(ponderId.toString()))
        }
      }
    `

    try {
      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(ponderId.toString(), t.UInt64),
          arg(option.toString(), t.UInt8)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      })

      const result = await fcl.tx(transactionId).onceSealed()
      return { success: true, transactionId, result }
    } catch (error) {
      console.error('Place free vote failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get all active ponders
  async getActivePonders() {
    const script = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      pub fun main(): [FlowPonder.Ponder] {
        let publicAccount = getAccount(${getContractAddress('FlowPonder')})
        let ponderRef = publicAccount.getCapability(FlowPonder.PonderPublicPath)
          .borrow<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>()
          ?? panic("Could not borrow PonderManager")

        return ponderRef.getAllActivePonders()
      }
    `

    try {
      const ponders = await fcl.query({
        cadence: script,
        args: (arg, t) => []
      })

      return { success: true, data: ponders }
    } catch (error) {
      console.error('Get active ponders failed:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  // Get specific ponder
  async getPonder(ponderId) {
    const script = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      pub fun main(ponderId: UInt64): FlowPonder.Ponder? {
        let publicAccount = getAccount(${getContractAddress('FlowPonder')})
        let ponderRef = publicAccount.getCapability(FlowPonder.PonderPublicPath)
          .borrow<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>()
          ?? panic("Could not borrow PonderManager")

        return ponderRef.getPonder(id: ponderId)
      }
    `

    try {
      const ponder = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(ponderId.toString(), t.UInt64)]
      })

      return { success: true, data: ponder }
    } catch (error) {
      console.error('Get ponder failed:', error)
      return { success: false, error: error.message, data: null }
    }
  }

  // Get user stats
  async getUserStats(userAddress) {
    const script = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      pub fun main(userAddress: Address): FlowPonder.UserStats? {
        let publicAccount = getAccount(${getContractAddress('FlowPonder')})
        let ponderRef = publicAccount.getCapability(FlowPonder.PonderPublicPath)
          .borrow<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>()
          ?? panic("Could not borrow PonderManager")

        return ponderRef.getUserStats(user: userAddress)
      }
    `

    try {
      const stats = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(userAddress, t.Address)]
      })

      return { success: true, data: stats }
    } catch (error) {
      console.error('Get user stats failed:', error)
      return { success: false, error: error.message, data: null }
    }
  }

  // Get user votes
  async getUserVotes(userAddress) {
    const script = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      pub fun main(userAddress: Address): [FlowPonder.Vote] {
        let publicAccount = getAccount(${getContractAddress('FlowPonder')})
        let ponderRef = publicAccount.getCapability(FlowPonder.PonderPublicPath)
          .borrow<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>()
          ?? panic("Could not borrow PonderManager")

        return ponderRef.getUserVotes(user: userAddress)
      }
    `

    try {
      const votes = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(userAddress, t.Address)]
      })

      return { success: true, data: votes }
    } catch (error) {
      console.error('Get user votes failed:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  // Get leaderboard
  async getLeaderboard() {
    const script = `
      import FlowPonder from ${getContractAddress('FlowPonder')}

      pub fun main(): [Address] {
        let publicAccount = getAccount(${getContractAddress('FlowPonder')})
        let ponderRef = publicAccount.getCapability(FlowPonder.PonderPublicPath)
          .borrow<&FlowPonder.PonderManager{FlowPonder.PonderPublic}>()
          ?? panic("Could not borrow PonderManager")

        return ponderRef.getLeaderboard()
      }
    `

    try {
      const leaderboard = await fcl.query({
        cadence: script,
        args: (arg, t) => []
      })

      return { success: true, data: leaderboard }
    } catch (error) {
      console.error('Get leaderboard failed:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  // Withdraw winnings
  async withdrawWinnings(ponderId) {
    const transaction = `
      import FlowPonder from ${getContractAddress('FlowPonder')}
      import FlowToken from 0x7e60df042a9c0868

      transaction(ponderId: UInt64) {
        let ponderManager: &FlowPonder.PonderManager
        let flowVault: &FlowToken.Vault

        prepare(signer: AuthAccount) {
          self.ponderManager = signer.borrow<&FlowPonder.PonderManager>(
            from: FlowPonder.PonderStoragePath
          ) ?? panic("Could not borrow PonderManager")

          self.flowVault = signer.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
          ) ?? panic("Could not borrow FlowToken vault")
        }

        execute {
          let winnings <- self.ponderManager.withdrawWinnings(ponderId: ponderId)
          self.flowVault.deposit(from: <-winnings)

          log("Winnings withdrawn for ponder ".concat(ponderId.toString()))
        }
      }
    `

    try {
      const transactionId = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [arg(ponderId.toString(), t.UInt64)],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 9999
      })

      const result = await fcl.tx(transactionId).onceSealed()
      return { success: true, transactionId, result }
    } catch (error) {
      console.error('Withdraw winnings failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Get Flow token balance
  async getFlowBalance(address) {
    const script = `
      import FlowToken from 0x7e60df042a9c0868

      pub fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.getCapability(/public/flowTokenBalance)
          .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
          ?? panic("Could not borrow Balance reference to the Vault")

        return vaultRef.balance
      }
    `

    try {
      const balance = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)]
      })

      return { success: true, data: parseFloat(balance) }
    } catch (error) {
      console.error('Get Flow balance failed:', error)
      return { success: false, error: error.message, data: 0 }
    }
  }
}

// Create singleton instance
const flowService = new FlowService()
export default flowService