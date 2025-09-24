// Leaderboard Screen - Rankings and user stats
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme, formatAmount } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('accuracy') // accuracy, winnings, votes
  
  const { user } = useAuth()
  const { showError } = useNotification()

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      
      // Get leaderboard addresses
      const leaderboardResult = await flowService.getLeaderboard()
      
      if (leaderboardResult.success) {
        const addresses = leaderboardResult.data || []
        
        // Get stats for each user
        const statsPromises = addresses.map(async (address) => {
          const result = await flowService.getUserStats(address)
          return {
            address,
            stats: result.success ? result.data : null
          }
        })
        
        const userStatsData = await Promise.all(statsPromises)
        
        // Filter out users without stats and sort
        const validUsers = userStatsData
          .filter(user => user.stats !== null)
          .sort((a, b) => {
            switch (filter) {
              case 'accuracy':
                return (b.stats.accuracy || 0) - (a.stats.accuracy || 0)
              case 'winnings':
                return (b.stats.totalWinnings || 0) - (a.stats.totalWinnings || 0)
              case 'votes':
                return (b.stats.totalVotes || 0) - (a.stats.totalVotes || 0)
              default:
                return 0
            }
          })
        
        setLeaderboard(validUsers)
        
        // Create stats lookup
        const statsLookup = {}
        validUsers.forEach(({ address, stats }) => {
          statsLookup[address] = stats
        })
        setUserStats(statsLookup)
        
      } else {
        showError('Failed to load leaderboard')
      }
    } catch (error) {
      console.error('Load leaderboard error:', error)
      showError('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadLeaderboard()
    setRefreshing(false)
  }, [filter])

  const formatAddress = (address) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return { name: 'trophy', color: '#FFD700' } // Gold
      case 2:
        return { name: 'medal', color: '#C0C0C0' } // Silver
      case 3:
        return { name: 'medal', color: '#CD7F32' } // Bronze
      default:
        return { name: 'person-circle-outline', color: theme.colors.textSecondary }
    }
  }

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'accuracy' && styles.filterTabActive]}
        onPress={() => setFilter('accuracy')}
      >
        <Text style={[styles.filterText, filter === 'accuracy' && styles.filterTextActive]}>
          Accuracy
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filter === 'winnings' && styles.filterTabActive]}
        onPress={() => setFilter('winnings')}
      >
        <Text style={[styles.filterText, filter === 'winnings' && styles.filterTextActive]}>
          Winnings
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, filter === 'votes' && styles.filterTabActive]}
        onPress={() => setFilter('votes')}
      >
        <Text style={[styles.filterText, filter === 'votes' && styles.filterTextActive]}>
          Volume
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderUserCard = ({ item, index }) => {
    const rank = index + 1
    const { address, stats } = item
    const rankIcon = getRankIcon(rank)
    const isCurrentUser = address === user?.addr
    
    return (
      <TouchableOpacity
        style={[
          styles.userCard,
          isCurrentUser && styles.currentUserCard,
          rank <= 3 && styles.topThreeCard
        ]}
        activeOpacity={0.8}
      >
        {rank <= 3 && (
          <LinearGradient
            colors={
              rank === 1 ? ['#FFD700', '#FFA500'] :
              rank === 2 ? ['#C0C0C0', '#808080'] :
              ['#CD7F32', '#8B4513']
            }
            style={styles.topThreeGradient}
          />
        )}
        
        <View style={styles.userCardContent}>
          <View style={styles.userInfo}>
            <View style={styles.rankContainer}>
              <Icon 
                name={rankIcon.name} 
                size={rank <= 3 ? 32 : 24} 
                color={rankIcon.color} 
              />
              <Text style={[
                styles.rankText,
                rank <= 3 && styles.topThreeRankText
              ]}>
                #{rank}
              </Text>
            </View>
            
            <View style={styles.userDetails}>
              <Text style={[
                styles.addressText,
                isCurrentUser && styles.currentUserText
              ]}>
                {isCurrentUser ? 'You' : formatAddress(address)}
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(stats.accuracy * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatAmount(stats.totalWinnings)}
                  </Text>
                  <Text style={styles.statLabel}>Winnings</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.totalVotes}
                  </Text>
                  <Text style={styles.statLabel}>Votes</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.primaryStat}>
            <Text style={styles.primaryStatValue}>
              {filter === 'accuracy' ? `${(stats.accuracy * 100).toFixed(1)}%` :
               filter === 'winnings' ? formatAmount(stats.totalWinnings) :
               stats.totalVotes.toString()}
            </Text>
          </View>
        </View>
        
        {isCurrentUser && (
          <View style={styles.currentUserBadge}>
            <Text style={styles.currentUserBadgeText}>YOU</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
      <Text style={styles.headerSubtitle}>
        Top predictors on FlowPonder
      </Text>
      {renderFilterTabs()}
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trophy-outline" size={80} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to make predictions and climb the leaderboard!
      </Text>
    </View>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.address}
        renderItem={renderUserCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          leaderboard.length === 0 && styles.emptyListContent
        ]}
      />
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
  listContent: {
    paddingBottom: theme.spacing.xl
  },
  emptyListContent: {
    flexGrow: 1
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  filterTab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.lightGray
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  filterTextActive: {
    color: theme.colors.white
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
  topThreeCard: {
    ...theme.shadows.md
  },
  topThreeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.lg
  },
  rankText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs
  },
  topThreeRankText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md
  },
  userDetails: {
    flex: 1
  },
  addressText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  currentUserText: {
    color: theme.colors.primary
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs
  },
  primaryStat: {
    alignItems: 'center'
  },
  primaryStatValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary
  },
  currentUserBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  currentUserBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center'
  }
})

export default LeaderboardScreen