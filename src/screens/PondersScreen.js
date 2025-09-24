// Ponders Screen - Main discovery feed for active prediction markets
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme, formatAmount, formatTime, getVotingColor } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const PondersScreen = ({ navigation }) => {
  const [ponders, setPonders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all, featured, ending-soon
  const { user, balance } = useAuth()
  const { showError } = useNotification()

  useEffect(() => {
    loadPonders()
  }, [])

  const loadPonders = async () => {
    try {
      setLoading(true)
      const result = await flowService.getActivePonders()

      if (result.success) {
        setPonders(result.data || [])
      } else {
        showError(result.error || 'Failed to load ponders')
      }
    } catch (error) {
      console.error('Load ponders error:', error)
      showError('Failed to load ponders')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPonders()
    setRefreshing(false)
  }, [])

  const filteredPonders = ponders.filter(ponder => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!ponder.question.toLowerCase().includes(query) &&
          !ponder.category.toLowerCase().includes(query)) {
        return false
      }
    }

    // Category filter
    if (filter === 'featured' && !ponder.isJuiced) {
      return false
    }

    if (filter === 'ending-soon') {
      const now = Date.now() / 1000
      const timeLeft = ponder.endTime - now
      if (timeLeft > 3600) { // More than 1 hour left
        return false
      }
    }

    return true
  })

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={theme.colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ponders..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'featured' && styles.filterTabActive]}
          onPress={() => setFilter('featured')}
        >
          <Text style={[styles.filterText, filter === 'featured' && styles.filterTextActive]}>
            🔥 Featured
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'ending-soon' && styles.filterTabActive]}
          onPress={() => setFilter('ending-soon')}
        >
          <Text style={[styles.filterText, filter === 'ending-soon' && styles.filterTextActive]}>
            ⏰ Ending Soon
          </Text>
        </TouchableOpacity>
      </View>

      {/* Balance Display */}
      <View style={styles.balanceContainer}>
        <Icon name="wallet" size={16} color={theme.colors.primary} />
        <Text style={styles.balanceText}>
          {formatAmount(balance)} FLOW
        </Text>
      </View>
    </View>
  )

  const renderPonderCard = ({ item: ponder }) => {
    const timeLeft = formatTime(ponder.endTime)
    const isEnding = ponder.endTime - Date.now() / 1000 < 3600 // Less than 1 hour

    return (
      <TouchableOpacity
        style={[styles.ponderCard, ponder.isJuiced && styles.featuredCard]}
        onPress={() => navigation.navigate('PonderDetail', {
          ponderId: ponder.id,
          title: ponder.question
        })}
        activeOpacity={0.8}
      >
        {ponder.isJuiced && (
          <LinearGradient
            colors={[theme.colors.juicedGold, '#FCD34D']}
            style={styles.featuredBadge}
          >
            <Icon name="star" size={12} color={theme.colors.white} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </LinearGradient>
        )}

        <View style={styles.ponderHeader}>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{ponder.category.toUpperCase()}</Text>
          </View>
          <View style={[styles.timeContainer, isEnding && styles.endingSoonContainer]}>
            <Icon
              name={isEnding ? "alarm" : "time"}
              size={14}
              color={isEnding ? theme.colors.error : theme.colors.textSecondary}
            />
            <Text style={[styles.timeText, isEnding && styles.endingSoonText]}>
              {timeLeft}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText} numberOfLines={3}>
          {ponder.question}
        </Text>

        <View style={styles.optionsContainer}>
          {ponder.options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View
                style={[
                  styles.optionDot,
                  { backgroundColor: getVotingColor(index, ponder.options.length) }
                ]}
              />
              <Text style={styles.optionText}>{option}</Text>
              <Text style={styles.votesText}>
                {ponder.voteCounts[index] || 0} votes
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.ponderFooter}>
          <View style={styles.poolContainer}>
            <Icon name="trophy" size={16} color={theme.colors.secondary} />
            <Text style={styles.poolText}>
              {formatAmount(ponder.totalPool + ponder.juiceAmount)} pool
            </Text>
          </View>

          <View style={styles.betRangeContainer}>
            <Text style={styles.betRangeText}>
              {formatAmount(ponder.minBet)} - {formatAmount(ponder.maxBet)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trending-up-outline" size={80} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Ponders Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? "Try adjusting your search terms"
          : "Be the first to create a ponder!"
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('Create')}
        >
          <Text style={styles.createButtonText}>Create Ponder</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ponders...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPonders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPonderCard}
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
          filteredPonders.length === 0 && styles.emptyListContent
        ]}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Create')}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryLight]}
          style={styles.fabGradient}
        >
          <Icon name="add" size={24} color={theme.colors.white} />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingBottom: 100 // Space for FAB
  },
  emptyListContent: {
    flexGrow: 1
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
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
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },
  balanceText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary
  },
  ponderCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: theme.colors.juicedGold
  },
  featuredBadge: {
    position: 'absolute',
    top: -8,
    right: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  featuredText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white
  },
  ponderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  categoryContainer: {
    backgroundColor: theme.colors.primaryLight + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  endingSoonContainer: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  timeText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  endingSoonText: {
    color: theme.colors.error
  },
  questionText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.lg,
    marginBottom: theme.spacing.md
  },
  optionsContainer: {
    marginBottom: theme.spacing.md
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs
  },
  optionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary
  },
  votesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary
  },
  ponderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  poolContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poolText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.secondary
  },
  betRangeContainer: {
    backgroundColor: theme.colors.lightGray,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  betRangeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary
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
    textAlign: 'center',
    marginBottom: theme.spacing.xl
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.lg
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default PondersScreen