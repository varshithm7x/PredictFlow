// Ponder Detail Screen - View and vote on specific ponder
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme, formatAmount, formatTime, getVotingColor } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const PonderDetailScreen = ({ route, navigation }) => {
  const { ponderId } = route.params
  const [ponder, setPonder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState(null)
  const [betAmount, setBetAmount] = useState('')
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [userVotes, setUserVotes] = useState([])

  const { user, balance, updateBalance } = useAuth()
  const { showSuccess, showError, showConfirmation } = useNotification()

  useEffect(() => {
    loadPonderDetails()
    loadUserVotes()
  }, [ponderId])

  const loadPonderDetails = async () => {
    try {
      setLoading(true)
      const result = await flowService.getPonder(ponderId)

      if (result.success && result.data) {
        setPonder(result.data)
      } else {
        showError('Ponder not found')
        navigation.goBack()
      }
    } catch (error) {
      console.error('Load ponder error:', error)
      showError('Failed to load ponder details')
    } finally {
      setLoading(false)
    }
  }

  const loadUserVotes = async () => {
    if (!user?.addr) return

    try {
      const result = await flowService.getUserVotes(user.addr)
      if (result.success) {
        const ponderVotes = result.data.filter(vote => vote.ponderId === ponderId)
        setUserVotes(ponderVotes)
      }
    } catch (error) {
      console.error('Load user votes error:', error)
    }
  }

  const handleVotePress = (optionIndex) => {
    setSelectedOption(optionIndex)
    setBetAmount('')
    setShowVoteModal(true)
  }

  const handleFreeVote = () => {
    showConfirmation(
      'Place Free Vote',
      `Are you sure you want to vote for "${ponder.options[selectedOption]}" without placing a bet?`,
      () => placeFreeVote(),
      () => setShowVoteModal(false)
    )
  }

  const handleBetVote = () => {
    const amount = parseFloat(betAmount)

    if (isNaN(amount) || amount < ponder.minBet) {
      showError(`Minimum bet is ${formatAmount(ponder.minBet)}`)
      return
    }

    if (amount > ponder.maxBet) {
      showError(`Maximum bet is ${formatAmount(ponder.maxBet)}`)
      return
    }

    if (amount > balance) {
      showError('Insufficient balance')
      return
    }

    showConfirmation(
      'Place Bet',
      `Are you sure you want to bet ${formatAmount(amount)} FLOW on "${ponder.options[selectedOption]}"?`,
      () => placeBetVote(amount),
      () => setShowVoteModal(false)
    )
  }

  const placeFreeVote = async () => {
    try {
      setIsVoting(true)
      setShowVoteModal(false)

      const result = await flowService.placeFreeVote(ponderId, selectedOption)

      if (result.success) {
        showSuccess('Free vote placed successfully!')
        await loadPonderDetails()
        await loadUserVotes()
      } else {
        showError(result.error || 'Failed to place vote')
      }
    } catch (error) {
      console.error('Place free vote error:', error)
      showError('Failed to place vote')
    } finally {
      setIsVoting(false)
    }
  }

  const placeBetVote = async (amount) => {
    try {
      setIsVoting(true)
      setShowVoteModal(false)

      const result = await flowService.placeVote(ponderId, selectedOption, amount)

      if (result.success) {
        showSuccess(`Bet of ${formatAmount(amount)} FLOW placed successfully!`)
        await loadPonderDetails()
        await loadUserVotes()
        await updateBalance()
      } else {
        showError(result.error || 'Failed to place bet')
      }
    } catch (error) {
      console.error('Place bet error:', error)
      showError('Failed to place bet')
    } finally {
      setIsVoting(false)
    }
  }

  const getOptionPercentage = (optionIndex) => {
    if (!ponder.voteCounts || ponder.voteCounts.length === 0) return 0

    const totalVotes = ponder.voteCounts.reduce((sum, count) => sum + count, 0)
    if (totalVotes === 0) return 0

    return (ponder.voteCounts[optionIndex] / totalVotes) * 100
  }

  const getUserVoteForOption = (optionIndex) => {
    return userVotes.find(vote => vote.option === optionIndex)
  }

  const isExpired = () => {
    return Date.now() / 1000 > ponder.endTime
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ponder...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!ponder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={80} color={theme.colors.error} />
          <Text style={styles.errorText}>Ponder not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const timeLeft = formatTime(ponder.endTime)
  const expired = isExpired()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {ponder.isJuiced && (
            <LinearGradient
              colors={[theme.colors.juicedGold, '#FCD34D']}
              style={styles.featuredBadge}
            >
              <Icon name="star" size={16} color={theme.colors.white} />
              <Text style={styles.featuredText}>FEATURED PONDER</Text>
            </LinearGradient>
          )}

          <View style={styles.metaContainer}>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{ponder.category.toUpperCase()}</Text>
            </View>
            <View style={[
              styles.timeContainer,
              expired && styles.expiredContainer
            ]}>
              <Icon
                name={expired ? "time" : "alarm"}
                size={16}
                color={expired ? theme.colors.error : theme.colors.textSecondary}
              />
              <Text style={[
                styles.timeText,
                expired && styles.expiredText
              ]}>
                {expired ? 'Ended' : timeLeft}
              </Text>
            </View>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{ponder.question}</Text>
          {ponder.description && (
            <Text style={styles.descriptionText}>{ponder.description}</Text>
          )}
        </View>

        {/* Pool Info */}
        <View style={styles.poolContainer}>
          <View style={styles.poolItem}>
            <Icon name="trophy" size={24} color={theme.colors.secondary} />
            <Text style={styles.poolLabel}>Total Pool</Text>
            <Text style={styles.poolValue}>
              {formatAmount(ponder.totalPool + ponder.juiceAmount)}
            </Text>
          </View>

          <View style={styles.poolItem}>
            <Icon name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.poolLabel}>Total Votes</Text>
            <Text style={styles.poolValue}>
              {ponder.voteCounts.reduce((sum, count) => sum + count, 0)}
            </Text>
          </View>

          <View style={styles.poolItem}>
            <Icon name="cash" size={24} color={theme.colors.warning} />
            <Text style={styles.poolLabel}>Bet Range</Text>
            <Text style={styles.poolValue}>
              {formatAmount(ponder.minBet)} - {formatAmount(ponder.maxBet)}
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Vote on Outcome</Text>
          {ponder.options.map((option, index) => {
            const percentage = getOptionPercentage(index)
            const userVote = getUserVoteForOption(index)

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  userVote && styles.optionCardVoted
                ]}
                onPress={() => !expired && handleVotePress(index)}
                disabled={expired || isVoting}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionInfo}>
                    <View
                      style={[
                        styles.optionDot,
                        { backgroundColor: getVotingColor(index, ponder.options.length) }
                      ]}
                    />
                    <Text style={styles.optionText}>{option}</Text>
                  </View>

                  <View style={styles.optionStats}>
                    <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
                    <Text style={styles.votesText}>
                      {ponder.voteCounts[index] || 0} votes
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: getVotingColor(index, ponder.options.length) + '40'
                      }
                    ]}
                  />
                </View>

                {/* User's Vote Info */}
                {userVote && (
                  <View style={styles.userVoteContainer}>
                    <Icon name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.userVoteText}>
                      You voted {userVote.isFreeVote ? 'for free' : `with ${formatAmount(userVote.amount)} FLOW`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* My Votes Section */}
        {userVotes.length > 0 && (
          <View style={styles.myVotesContainer}>
            <Text style={styles.myVotesTitle}>My Votes</Text>
            {userVotes.map((vote, index) => (
              <View key={index} style={styles.myVoteCard}>
                <View style={styles.myVoteHeader}>
                  <View
                    style={[
                      styles.optionDot,
                      { backgroundColor: getVotingColor(vote.option, ponder.options.length) }
                    ]}
                  />
                  <Text style={styles.myVoteOption}>
                    {ponder.options[vote.option]}
                  </Text>
                  <Text style={styles.myVoteAmount}>
                    {vote.isFreeVote ? 'Free' : formatAmount(vote.amount)}
                  </Text>
                </View>
                <Text style={styles.myVoteTime}>
                  {new Date(vote.timestamp * 1000).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Vote Modal */}
      <Modal
        visible={showVoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place Your Vote</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowVoteModal(false)}
              >
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOption !== null && (
              <View style={styles.modalContent}>
                <Text style={styles.selectedOptionText}>
                  Voting for: "{ponder.options[selectedOption]}"
                </Text>

                <View style={styles.voteOptions}>
                  {/* Free Vote */}
                  <TouchableOpacity
                    style={styles.freeVoteButton}
                    onPress={handleFreeVote}
                  >
                    <Icon name="hand-right" size={20} color={theme.colors.primary} />
                    <Text style={styles.freeVoteText}>Vote for Free</Text>
                    <Text style={styles.freeVoteSubtext}>
                      No winnings, just for fun
                    </Text>
                  </TouchableOpacity>

                  {/* Bet Vote */}
                  <View style={styles.betVoteContainer}>
                    <Text style={styles.betVoteLabel}>Or place a bet:</Text>
                    <TextInput
                      style={styles.betAmountInput}
                      placeholder="Enter amount in FLOW"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={betAmount}
                      onChangeText={setBetAmount}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.betRangeText}>
                      Range: {formatAmount(ponder.minBet)} - {formatAmount(ponder.maxBet)}
                    </Text>
                    <Text style={styles.balanceText}>
                      Your balance: {formatAmount(balance)} FLOW
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.betVoteButton,
                        (!betAmount || parseFloat(betAmount) < ponder.minBet) &&
                        styles.betVoteButtonDisabled
                      ]}
                      onPress={handleBetVote}
                      disabled={!betAmount || parseFloat(betAmount) < ponder.minBet}
                    >
                      <LinearGradient
                        colors={
                          !betAmount || parseFloat(betAmount) < ponder.minBet
                            ? [theme.colors.gray, theme.colors.gray]
                            : [theme.colors.success, theme.colors.secondaryLight]
                        }
                        style={styles.betVoteButtonGradient}
                      >
                        <Icon name="cash" size={20} color={theme.colors.white} />
                        <Text style={styles.betVoteButtonText}>
                          Place Bet
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md
  },
  featuredText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categoryContainer: {
    backgroundColor: theme.colors.primaryLight + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  expiredContainer: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  timeText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  expiredText: {
    color: theme.colors.error
  },
  questionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xl,
    marginBottom: theme.spacing.md
  },
  descriptionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md
  },
  poolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm
  },
  poolItem: {
    alignItems: 'center',
    flex: 1
  },
  poolLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center'
  },
  poolValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center'
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg
  },
  optionsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm
  },
  optionCardVoted: {
    borderColor: theme.colors.success,
    borderWidth: 2
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    flex: 1
  },
  optionStats: {
    alignItems: 'flex-end'
  },
  percentageText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text
  },
  votesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 2,
    marginBottom: theme.spacing.sm
  },
  progressBar: {
    height: 4,
    borderRadius: 2
  },
  userVoteContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userVoteText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.success
  },
  myVotesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg
  },
  myVotesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  myVoteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success
  },
  myVoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  myVoteOption: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text
  },
  myVoteAmount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary
  },
  myVoteTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    marginLeft: 20
  },
  bottomSpacing: {
    height: theme.spacing.xxl
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text
  },
  modalCloseButton: {
    padding: theme.spacing.sm
  },
  modalContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg
  },
  selectedOptionText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center'
  },
  voteOptions: {
    gap: theme.spacing.lg
  },
  freeVoteButton: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
  freeVoteText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm
  },
  freeVoteSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs
  },
  betVoteContainer: {
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg
  },
  betVoteLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  betAmountInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm
  },
  betRangeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs
  },
  balanceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md
  },
  betVoteButton: {
    borderRadius: theme.borderRadius.lg
  },
  betVoteButtonDisabled: {
    opacity: 0.5
  },
  betVoteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg
  },
  betVoteButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
  }
})

export default PonderDetailScreen