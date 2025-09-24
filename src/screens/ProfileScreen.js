// Profile Screen - User profile, stats, and settings
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme, formatAmount } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const ProfileScreen = ({ navigation }) => {
  const [userStats, setUserStats] = useState(null)
  const [userVotes, setUserVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const { user, balance, signOut, updateBalance } = useAuth()
  const { showError, showConfirmation, showSuccess } = useNotification()

  useEffect(() => {
    if (user?.addr) {
      loadUserData()
    }
  }, [user?.addr])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Load user stats
      const statsResult = await flowService.getUserStats(user.addr)
      if (statsResult.success) {
        setUserStats(statsResult.data)
      }
      
      // Load user votes
      const votesResult = await flowService.getUserVotes(user.addr)
      if (votesResult.success) {
        setUserVotes(votesResult.data)
      }
      
      // Update balance
      await updateBalance()
      
    } catch (error) {
      console.error('Load user data error:', error)
      showError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    setRefreshing(false)
  }

  const handleSignOut = () => {
    showConfirmation(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        const result = await signOut()
        if (result.success) {
          showSuccess('Signed out successfully')
        } else {
          showError('Failed to sign out')
        }
      }
    )
  }

  const formatAddress = (address) => {
    if (!address) return 'Not connected'
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.8) return theme.colors.success
    if (accuracy >= 0.6) return theme.colors.warning
    return theme.colors.error
  }

  const renderProfileHeader = () => (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryLight]}
      style={styles.profileHeader}
    >
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={60} color={theme.colors.white} />
        </View>
        
        <Text style={styles.addressText}>
          {formatAddress(user?.addr)}
        </Text>
        
        <View style={styles.balanceContainer}>
          <Icon name="wallet" size={20} color={theme.colors.white} />
          <Text style={styles.balanceText}>
            {formatAmount(balance)} FLOW
          </Text>
        </View>
      </View>
    </LinearGradient>
  )

  const renderStatsSection = () => {
    if (!userStats) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <Text style={styles.noDataText}>No prediction history yet</Text>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(userStats.accuracy * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
            <View style={[
              styles.accuracyIndicator,
              { backgroundColor: getAccuracyColor(userStats.accuracy) }
            ]} />
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatAmount(userStats.totalWinnings)}
            </Text>
            <Text style={styles.statLabel}>Total Winnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {userStats.totalVotes}
            </Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatAmount(userStats.totalStaked)}
            </Text>
            <Text style={styles.statLabel}>Total Staked</Text>
          </View>
        </View>

        <View style={styles.achievementContainer}>
          <Text style={styles.achievementTitle}>Achievement</Text>
          <View style={styles.achievement}>
            <Icon name="trophy" size={24} color={theme.colors.secondary} />
            <Text style={styles.achievementText}>
              {userStats.correctPredictions > 0 ? 
                `${userStats.correctPredictions} Correct Predictions` : 
                'Make your first prediction!'
              }
            </Text>
          </View>
        </View>
      </View>
    )
  }

  const renderRecentActivity = () => {
    const recentVotes = userVotes.slice(0, 5) // Show last 5 votes
    
    if (recentVotes.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.noDataText}>No recent activity</Text>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => {/* Navigate to full history */}}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentVotes.map((vote, index) => (
          <TouchableOpacity
            key={index}
            style={styles.activityCard}
            onPress={() => navigation.navigate('PonderDetail', { ponderId: vote.ponderId })}
          >
            <View style={styles.activityContent}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>
                  {vote.isFreeVote ? 'Free Vote' : 'Bet Placed'}
                </Text>
                <Text style={styles.activityAmount}>
                  {vote.isFreeVote ? 'No stake' : formatAmount(vote.amount)}
                </Text>
              </View>
              <Text style={styles.activityDate}>
                {new Date(vote.timestamp * 1000).toLocaleDateString()}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      
      <TouchableOpacity
        style={styles.actionCard}
        onPress={() => navigation.navigate('Wallet')}
      >
        <View style={styles.actionContent}>
          <Icon name="wallet-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Manage Wallet</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionCard}
        onPress={onRefresh}
      >
        <View style={styles.actionContent}>
          <Icon name="refresh-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Refresh Data</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionCard, styles.signOutCard]}
        onPress={handleSignOut}
      >
        <View style={styles.actionContent}>
          <Icon name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.actionText, styles.signOutText]}>Sign Out</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </TouchableOpacity>
    </View>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
        {renderProfileHeader()}
        {renderStatsSection()}
        {renderRecentActivity()}
        {renderActions()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  profileHeader: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg
  },
  profileContent: {
    alignItems: 'center'
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg
  },
  addressText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full
  },
  balanceText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
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
  noDataText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  },
  accuracyIndicator: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginTop: theme.spacing.sm
  },
  achievementContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  achievementTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  achievementText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm
  },
  activityContent: {
    flex: 1
  },
  activityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  activityType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text
  },
  activityAmount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary
  },
  activityDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm
  },
  signOutCard: {
    borderWidth: 1,
    borderColor: theme.colors.error + '40'
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text
  },
  signOutText: {
    color: theme.colors.error
  },
  bottomSpacing: {
    height: theme.spacing.xxl
  }
})

export default ProfileScreen