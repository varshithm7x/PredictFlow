// Wallet Screen - Balance management, transactions, and wallet connection
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme, formatAmount } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const WalletScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpLoading, setTopUpLoading] = useState(false)

  const { user, balance, updateBalance, signOut } = useAuth()
  const { showError, showSuccess, showConfirmation } = useNotification()

  useEffect(() => {
    if (user?.addr) {
      loadWalletData()
    }
  }, [user?.addr])

  const loadWalletData = async () => {
    try {
      setLoading(true)

      // Update balance
      await updateBalance()

      // Load transaction history
      const result = await flowService.getTransactionHistory(user.addr)
      if (result.success) {
        setTransactions(result.data)
      } else {
        showError('Failed to load transaction history')
      }

    } catch (error) {
      console.error('Load wallet data error:', error)
      showError('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWalletData()
    setRefreshing(false)
  }

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      showError('Please enter a valid amount')
      return
    }

    try {
      setTopUpLoading(true)

      // In a real app, this would integrate with Flow's faucet or payment gateway
      const result = await flowService.requestTestnetTokens(user.addr, parseFloat(topUpAmount))

      if (result.success) {
        showSuccess(`Successfully requested ${topUpAmount} FLOW tokens`)
        setTopUpAmount('')
        setShowTopUpModal(false)
        await updateBalance()
      } else {
        showError(result.error || 'Failed to request tokens')
      }

    } catch (error) {
      console.error('Top up error:', error)
      showError('Failed to request tokens')
    } finally {
      setTopUpLoading(false)
    }
  }

  const handleDisconnect = () => {
    showConfirmation(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      async () => {
        const result = await signOut()
        if (result.success) {
          navigation.navigate('Onboarding')
          showSuccess('Wallet disconnected successfully')
        } else {
          showError('Failed to disconnect wallet')
        }
      }
    )
  }

  const formatAddress = (address) => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'vote': return 'checkmark-circle'
      case 'bet': return 'trending-up'
      case 'winnings': return 'trophy'
      case 'topup': return 'add-circle'
      case 'withdrawal': return 'remove-circle'
      default: return 'swap-horizontal'
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'winnings':
      case 'topup':
        return theme.colors.success
      case 'bet':
      case 'withdrawal':
        return theme.colors.error
      case 'vote':
        return theme.colors.primary
      default:
        return theme.colors.textSecondary
    }
  }

  const renderWalletHeader = () => (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryLight]}
      style={styles.walletHeader}
    >
      <View style={styles.walletContent}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>FLOW Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatAmount(balance)}
          </Text>
          <Text style={styles.balanceSubtext}>
            ≈ ${(balance * 0.50).toFixed(2)} USD
          </Text>
        </View>

        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Wallet Address</Text>
          <TouchableOpacity style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {formatAddress(user?.addr)}
            </Text>
            <Icon name="copy-outline" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowTopUpModal(true)}
        >
          <LinearGradient
            colors={[theme.colors.success, theme.colors.successLight]}
            style={styles.actionGradient}
          >
            <Icon name="add" size={24} color={theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Top Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Ponders')}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryLight]}
            style={styles.actionGradient}
          >
            <Icon name="trending-up" size={24} color={theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Predict</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Create')}
        >
          <LinearGradient
            colors={[theme.colors.secondary, theme.colors.secondaryLight]}
            style={styles.actionGradient}
          >
            <Icon name="create" size={24} color={theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRefresh}
        >
          <LinearGradient
            colors={[theme.colors.warning, theme.colors.warningLight]}
            style={styles.actionGradient}
          >
            <Icon name="refresh" size={24} color={theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionLabel}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderTransactionHistory = () => {
    if (transactions.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.emptyState}>
            <Icon name="receipt-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transaction history will appear here
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => {/* Navigate to full history */}}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.slice(0, 10).map((tx, index) => (
          <TouchableOpacity
            key={index}
            style={styles.transactionCard}
          >
            <View style={styles.transactionContent}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: getTransactionColor(tx.type) + '20' }
              ]}>
                <Icon
                  name={getTransactionIcon(tx.type)}
                  size={20}
                  color={getTransactionColor(tx.type)}
                />
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>
                    {tx.description}
                  </Text>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(tx.type) }
                  ]}>
                    {tx.type === 'bet' || tx.type === 'withdrawal' ? '-' : '+'}
                    {formatAmount(tx.amount)}
                  </Text>
                </View>

                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.timestamp * 1000).toLocaleDateString()}
                  </Text>
                  <Text style={styles.transactionStatus}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Wallet Settings</Text>

      <TouchableOpacity
        style={styles.settingCard}
        onPress={() => {/* Navigate to security settings */}}
      >
        <View style={styles.settingContent}>
          <Icon name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.settingText}>Security Settings</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingCard}
        onPress={() => {/* Navigate to backup */}}
      >
        <View style={styles.settingContent}>
          <Icon name="cloud-upload-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.settingText}>Backup Wallet</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.settingCard, styles.dangerSetting]}
        onPress={handleDisconnect}
      >
        <View style={styles.settingContent}>
          <Icon name="unlink-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.settingText, styles.dangerText]}>Disconnect Wallet</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    </View>
  )

  const renderTopUpModal = () => (
    <Modal
      visible={showTopUpModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTopUpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Top Up Wallet</Text>
            <TouchableOpacity
              onPress={() => setShowTopUpModal(false)}
              style={styles.modalClose}
            >
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Request test FLOW tokens from the testnet faucet
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount (FLOW)</Text>
            <TextInput
              style={styles.input}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              editable={!topUpLoading}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTopUpModal(false)}
              disabled={topUpLoading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleTopUp}
              disabled={topUpLoading}
            >
              {topUpLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.confirmText}>Request Tokens</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderWalletHeader()}
        {renderQuickActions()}
        {renderTransactionHistory()}
        {renderSettings()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderTopUpModal()}
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
  scrollView: {
    flex: 1
  },
  walletHeader: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg
  },
  walletContent: {
    alignItems: 'center'
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: theme.spacing.sm
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs
  },
  balanceSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.7
  },
  walletInfo: {
    alignItems: 'center'
  },
  walletLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: theme.spacing.sm
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full
  },
  addressText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontFamily: 'monospace',
    marginRight: theme.spacing.sm
  },
  section: {
    marginTop: -theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'center'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md
  },
  transactionDetails: {
    flex: 1
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  transactionType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text
  },
  transactionAmount: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary
  },
  transactionStatus: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium
  },
  settingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm
  },
  dangerSetting: {
    borderWidth: 1,
    borderColor: theme.colors.error + '40'
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text
  },
  dangerText: {
    color: theme.colors.error
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    width: '90%',
    maxWidth: 400
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text
  },
  modalClose: {
    padding: theme.spacing.sm
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl
  },
  inputContainer: {
    marginBottom: theme.spacing.xl
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    alignItems: 'center'
  },
  cancelText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginLeft: theme.spacing.sm,
    alignItems: 'center'
  },
  confirmText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
  },
  bottomSpacing: {
    height: theme.spacing.xxl
  }
})

export default WalletScreen