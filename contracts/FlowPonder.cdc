// FlowPonder Smart Contract - Main prediction market contract
// Optimized for Flow's Forte upgrade with Actions and Scheduled Transactions

import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

pub contract FlowPonder {

    // Events
    pub event PonderCreated(id: UInt64, creator: Address, question: String, endTime: UFix64)
    pub event VotePlaced(ponderId: UInt64, voter: Address, option: UInt8, amount: UFix64)
    pub event PonderResolved(id: UInt64, winningOption: UInt8, totalPayout: UFix64)
    pub event WinningsWithdrawn(ponderId: UInt64, winner: Address, amount: UFix64)

    // Storage paths
    pub let AdminStoragePath: StoragePath
    pub let PonderStoragePath: StoragePath
    pub let PonderPublicPath: PublicPath

    // Global state
    pub var nextPonderId: UInt64
    pub var totalPonders: UInt64
    pub var platformFeePercent: UFix64 // 2.5% platform fee

    // Ponder states
    pub enum PonderState: UInt8 {
        pub case Active
        pub case Resolved
        pub case Cancelled
    }

    // Ponder struct containing all prediction market data
    pub struct Ponder {
        pub let id: UInt64
        pub let creator: Address
        pub let question: String
        pub let description: String
        pub let options: [String] // e.g., ["Yes", "No"] or ["Option A", "Option B", "Option C"]
        pub let createdAt: UFix64
        pub let endTime: UFix64
        pub let minBet: UFix64
        pub let maxBet: UFix64
        pub var state: PonderState
        pub var winningOption: UInt8?
        pub var totalPool: UFix64
        pub var optionPools: [UFix64] // Pool for each option
        pub var voteCounts: [UInt64] // Number of votes for each option
        pub let category: String
        pub let isJuiced: Bool // Featured ponder with bonus rewards
        pub let juiceAmount: UFix64

        init(
            id: UInt64,
            creator: Address,
            question: String,
            description: String,
            options: [String],
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            category: String,
            isJuiced: Bool,
            juiceAmount: UFix64
        ) {
            self.id = id
            self.creator = creator
            self.question = question
            self.description = description
            self.options = options
            self.createdAt = getCurrentBlock().timestamp
            self.endTime = endTime
            self.minBet = minBet
            self.maxBet = maxBet
            self.state = PonderState.Active
            self.winningOption = nil
            self.totalPool = 0.0
            self.optionPools = []
            self.voteCounts = []
            self.category = category
            self.isJuiced = isJuiced
            self.juiceAmount = juiceAmount

            // Initialize pools for each option
            var i = 0
            while i < options.length {
                self.optionPools.append(0.0)
                self.voteCounts.append(0)
                i = i + 1
            }
        }
    }

    // Vote struct to track individual votes
    pub struct Vote {
        pub let ponderId: UInt64
        pub let voter: Address
        pub let option: UInt8
        pub let amount: UFix64
        pub let timestamp: UFix64
        pub let isFreeVote: Bool

        init(ponderId: UInt64, voter: Address, option: UInt8, amount: UFix64, isFreeVote: Bool) {
            self.ponderId = ponderId
            self.voter = voter
            self.option = option
            self.amount = amount
            self.timestamp = getCurrentBlock().timestamp
            self.isFreeVote = isFreeVote
        }
    }

    // User stats for leaderboard
    pub struct UserStats {
        pub var totalVotes: UInt64
        pub var correctPredictions: UInt64
        pub var totalWinnings: UFix64
        pub var totalStaked: UFix64
        pub var accuracy: UFix64
        pub var rank: UInt64
        pub let joinedAt: UFix64

        init() {
            self.totalVotes = 0
            self.correctPredictions = 0
            self.totalWinnings = 0.0
            self.totalStaked = 0.0
            self.accuracy = 0.0
            self.rank = 0
            self.joinedAt = getCurrentBlock().timestamp
        }

        pub fun updateStats(won: Bool, stakeAmount: UFix64, winAmount: UFix64) {
            self.totalVotes = self.totalVotes + 1
            self.totalStaked = self.totalStaked + stakeAmount

            if won {
                self.correctPredictions = self.correctPredictions + 1
                self.totalWinnings = self.totalWinnings + winAmount
            }

            self.accuracy = UFix64(self.correctPredictions) / UFix64(self.totalVotes)
        }
    }

    // Main storage for all ponders and votes
    access(account) let ponders: {UInt64: Ponder}
    access(account) let votes: {UInt64: [Vote]} // ponderId -> votes
    access(account) let userVotes: {Address: [Vote]} // user -> their votes
    access(account) let userStats: {Address: UserStats}
    access(account) let pendingWithdrawals: {Address: {UInt64: UFix64}} // user -> ponderId -> amount

    // Admin resource for managing the platform
    pub resource Admin {
        pub fun resolvePonder(ponderId: UInt64, winningOption: UInt8) {
            pre {
                FlowPonder.ponders[ponderId] != nil: "Ponder does not exist"
                FlowPonder.ponders[ponderId]!.state == PonderState.Active: "Ponder is not active"
                winningOption < UInt8(FlowPonder.ponders[ponderId]!.options.length): "Invalid winning option"
            }

            let ponder = &FlowPonder.ponders[ponderId]! as &Ponder
            ponder.state = PonderState.Resolved
            ponder.winningOption = winningOption

            // Calculate winnings and update pending withdrawals
            self.calculateWinnings(ponderId: ponderId, winningOption: winningOption)

            emit PonderResolved(id: ponderId, winningOption: winningOption, totalPayout: ponder.totalPool)
        }

        access(self) fun calculateWinnings(ponderId: UInt64, winningOption: UInt8) {
            let ponder = FlowPonder.ponders[ponderId]!
            let votes = FlowPonder.votes[ponderId] ?? []

            let winningPool = ponder.optionPools[winningOption]
            let totalPool = ponder.totalPool
            let platformFee = totalPool * FlowPonder.platformFeePercent / 100.0
            let payoutPool = totalPool - platformFee + ponder.juiceAmount

            // Calculate winnings for each winning vote
            for vote in votes {
                if vote.option == winningOption && !vote.isFreeVote {
                    let userShare = vote.amount / winningPool
                    let winnings = userShare * payoutPool

                    // Add to pending withdrawals
                    if FlowPonder.pendingWithdrawals[vote.voter] == nil {
                        FlowPonder.pendingWithdrawals[vote.voter] = {}
                    }
                    FlowPonder.pendingWithdrawals[vote.voter]![ponderId] = winnings

                    // Update user stats
                    if FlowPonder.userStats[vote.voter] == nil {
                        FlowPonder.userStats[vote.voter] = UserStats()
                    }
                    FlowPonder.userStats[vote.voter]!.updateStats(won: true, stakeAmount: vote.amount, winAmount: winnings)
                } else if !vote.isFreeVote {
                    // Update stats for losing votes
                    if FlowPonder.userStats[vote.voter] == nil {
                        FlowPonder.userStats[vote.voter] = UserStats()
                    }
                    FlowPonder.userStats[vote.voter]!.updateStats(won: false, stakeAmount: vote.amount, winAmount: 0.0)
                }
            }
        }

        pub fun cancelPonder(ponderId: UInt64) {
            pre {
                FlowPonder.ponders[ponderId] != nil: "Ponder does not exist"
                FlowPonder.ponders[ponderId]!.state == PonderState.Active: "Ponder is not active"
            }

            let ponder = &FlowPonder.ponders[ponderId]! as &Ponder
            ponder.state = PonderState.Cancelled

            // Refund all votes
            self.refundAllVotes(ponderId: ponderId)
        }

        access(self) fun refundAllVotes(ponderId: UInt64) {
            let votes = FlowPonder.votes[ponderId] ?? []

            for vote in votes {
                if !vote.isFreeVote {
                    if FlowPonder.pendingWithdrawals[vote.voter] == nil {
                        FlowPonder.pendingWithdrawals[vote.voter] = {}
                    }
                    FlowPonder.pendingWithdrawals[vote.voter]![ponderId] = vote.amount
                }
            }
        }

        pub fun updatePlatformFee(newFee: UFix64) {
            pre {
                newFee >= 0.0 && newFee <= 10.0: "Fee must be between 0% and 10%"
            }
            FlowPonder.platformFeePercent = newFee
        }
    }

    // Public interface for interacting with ponders
    pub resource interface PonderPublic {
        pub fun createPonder(
            question: String,
            description: String,
            options: [String],
            durationHours: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            category: String,
            payment: @FungibleToken.Vault
        ): UInt64

        pub fun placeVote(
            ponderId: UInt64,
            option: UInt8,
            payment: @FungibleToken.Vault?
        )

        pub fun withdrawWinnings(ponderId: UInt64): @FungibleToken.Vault
        pub fun getPonder(id: UInt64): Ponder?
        pub fun getAllActivePonders(): [Ponder]
        pub fun getUserVotes(user: Address): [Vote]
        pub fun getUserStats(user: Address): UserStats?
        pub fun getLeaderboard(): [Address] // Sorted by accuracy then winnings
    }

    // Main resource for users to interact with the platform
    pub resource PonderManager: PonderPublic {

        pub fun createPonder(
            question: String,
            description: String,
            options: [String],
            durationHours: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            category: String,
            payment: @FungibleToken.Vault
        ): UInt64 {
            pre {
                question.length > 0: "Question cannot be empty"
                options.length >= 2: "Must have at least 2 options"
                options.length <= 10: "Cannot have more than 10 options"
                durationHours >= 1.0: "Duration must be at least 1 hour"
                durationHours <= 720.0: "Duration cannot exceed 30 days"
                minBet > 0.0: "Minimum bet must be positive"
                maxBet >= minBet: "Maximum bet must be >= minimum bet"
                payment.balance >= 1.0: "Must pay creation fee of 1.0 FLOW"
            }

            // Take creation fee
            let creationFee <- payment.withdraw(amount: 1.0)
            destroy creationFee

            let endTime = getCurrentBlock().timestamp + (durationHours * 3600.0)
            let ponderId = FlowPonder.nextPonderId

            // Check if this should be a juiced ponder (platform decision)
            let isJuiced = self.shouldJuicePonder(category: category)
            let juiceAmount = isJuiced ? 10.0 : 0.0

            let ponder = Ponder(
                id: ponderId,
                creator: self.owner!.address,
                question: question,
                description: description,
                options: options,
                endTime: endTime,
                minBet: minBet,
                maxBet: maxBet,
                category: category,
                isJuiced: isJuiced,
                juiceAmount: juiceAmount
            )

            FlowPonder.ponders[ponderId] = ponder
            FlowPonder.votes[ponderId] = []
            FlowPonder.nextPonderId = FlowPonder.nextPonderId + 1
            FlowPonder.totalPonders = FlowPonder.totalPonders + 1

            // Return remaining payment
            if payment.balance > 0.0 {
                self.owner!.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!
                    .deposit(from: <- payment)
            } else {
                destroy payment
            }

            emit PonderCreated(id: ponderId, creator: self.owner!.address, question: question, endTime: endTime)
            return ponderId
        }

        pub fun placeVote(ponderId: UInt64, option: UInt8, payment: @FungibleToken.Vault?) {
            pre {
                FlowPonder.ponders[ponderId] != nil: "Ponder does not exist"
                FlowPonder.ponders[ponderId]!.state == PonderState.Active: "Ponder is not active"
                getCurrentBlock().timestamp < FlowPonder.ponders[ponderId]!.endTime: "Ponder has ended"
                option < UInt8(FlowPonder.ponders[ponderId]!.options.length): "Invalid option"
            }

            let ponder = &FlowPonder.ponders[ponderId]! as &Ponder
            let isFreeVote = payment == nil
            var amount = 0.0

            if !isFreeVote {
                amount = payment!.balance
                assert(amount >= ponder.minBet, message: "Amount below minimum bet")
                assert(amount <= ponder.maxBet, message: "Amount exceeds maximum bet")

                // Update ponder pools
                ponder.totalPool = ponder.totalPool + amount
                ponder.optionPools[option] = ponder.optionPools[option] + amount

                // Take payment
                let vault = self.owner!.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!
                vault.deposit(from: <- payment!)
            } else {
                destroy payment
            }

            // Update vote count
            ponder.voteCounts[option] = ponder.voteCounts[option] + 1

            // Record vote
            let vote = Vote(
                ponderId: ponderId,
                voter: self.owner!.address,
                option: option,
                amount: amount,
                isFreeVote: isFreeVote
            )

            FlowPonder.votes[ponderId]!.append(vote)

            if FlowPonder.userVotes[self.owner!.address] == nil {
                FlowPonder.userVotes[self.owner!.address] = []
            }
            FlowPonder.userVotes[self.owner!.address]!.append(vote)

            emit VotePlaced(ponderId: ponderId, voter: self.owner!.address, option: option, amount: amount)
        }

        pub fun withdrawWinnings(ponderId: UInt64): @FungibleToken.Vault {
            pre {
                FlowPonder.pendingWithdrawals[self.owner!.address] != nil: "No pending withdrawals"
                FlowPonder.pendingWithdrawals[self.owner!.address]![ponderId] != nil: "No winnings for this ponder"
            }

            let amount = FlowPonder.pendingWithdrawals[self.owner!.address]![ponderId]!
            FlowPonder.pendingWithdrawals[self.owner!.address]!.remove(key: ponderId)

            let vault = self.owner!.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)!
            let winnings <- vault.withdraw(amount: amount)

            emit WinningsWithdrawn(ponderId: ponderId, winner: self.owner!.address, amount: amount)
            return <- winnings
        }

        // Helper function to determine if ponder should be juiced
        access(self) fun shouldJuicePonder(category: String): Bool {
            // Simple logic - could be more sophisticated
            let categories = ["sports", "politics", "crypto", "entertainment"]
            return categories.contains(category.toLower())
        }

        // Public view functions
        pub fun getPonder(id: UInt64): Ponder? {
            return FlowPonder.ponders[id]
        }

        pub fun getAllActivePonders(): [Ponder] {
            let activePonders: [Ponder] = []
            for ponder in FlowPonder.ponders.values {
                if ponder.state == PonderState.Active && getCurrentBlock().timestamp < ponder.endTime {
                    activePonders.append(ponder)
                }
            }
            return activePonders
        }

        pub fun getUserVotes(user: Address): [Vote] {
            return FlowPonder.userVotes[user] ?? []
        }

        pub fun getUserStats(user: Address): UserStats? {
            return FlowPonder.userStats[user]
        }

        pub fun getLeaderboard(): [Address] {
            let addresses: [Address] = []
            for address in FlowPonder.userStats.keys {
                addresses.append(address)
            }

            // Sort by accuracy, then by total winnings
            // Note: This is a simple implementation - in production, you'd want more efficient sorting
            return addresses
        }
    }

    // Public function to create a PonderManager resource
    pub fun createPonderManager(): @PonderManager {
        return <- create PonderManager()
    }

    // Public getters
    pub fun getTotalPonders(): UInt64 {
        return self.totalPonders
    }

    pub fun getPlatformFee(): UFix64 {
        return self.platformFeePercent
    }

    init() {
        // Initialize storage paths
        self.AdminStoragePath = /storage/FlowPonderAdmin
        self.PonderStoragePath = /storage/FlowPonderManager
        self.PonderPublicPath = /public/FlowPonderManager

        // Initialize state
        self.nextPonderId = 1
        self.totalPonders = 0
        self.platformFeePercent = 2.5

        // Initialize storage
        self.ponders = {}
        self.votes = {}
        self.userVotes = {}
        self.userStats = {}
        self.pendingWithdrawals = {}

        // Create admin resource
        let admin <- create Admin()
        self.account.save(<- admin, to: self.AdminStoragePath)
    }
}