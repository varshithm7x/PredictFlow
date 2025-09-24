// Create Screen - Create new ponders/prediction markets
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import flowService from '../services/FlowService'

const CreateScreen = ({ navigation }) => {
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [category, setCategory] = useState('')
  const [duration, setDuration] = useState('24')
  const [minBet, setMinBet] = useState('0.50')
  const [maxBet, setMaxBet] = useState('100.00')
  const [isCreating, setIsCreating] = useState(false)

  const { user, balance } = useAuth()
  const { showSuccess, showError, showConfirmation } = useNotification()

  const categories = [
    'Sports', 'Politics', 'Crypto', 'Entertainment', 'Technology', 
    'Science', 'Economics', 'Social', 'Gaming', 'Other'
  ]

  const durationOptions = [
    { label: '1 Hour', value: '1' },
    { label: '6 Hours', value: '6' },
    { label: '1 Day', value: '24' },
    { label: '3 Days', value: '72' },
    { label: '1 Week', value: '168' },
    { label: '1 Month', value: '720' }
  ]

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const validateForm = () => {
    if (!question.trim()) {
      showError('Please enter a question')
      return false
    }

    if (question.length < 10) {
      showError('Question must be at least 10 characters long')
      return false
    }

    if (question.length > 500) {
      showError('Question must be less than 500 characters')
      return false
    }

    const validOptions = options.filter(option => option.trim())
    if (validOptions.length < 2) {
      showError('Please provide at least 2 options')
      return false
    }

    if (!category) {
      showError('Please select a category')
      return false
    }

    const minAmount = parseFloat(minBet)
    const maxAmount = parseFloat(maxBet)

    if (isNaN(minAmount) || minAmount < 0.1) {
      showError('Minimum bet must be at least $0.10')
      return false
    }

    if (isNaN(maxAmount) || maxAmount < minAmount) {
      showError('Maximum bet must be greater than minimum bet')
      return false
    }

    if (balance < 1.0) {
      showError('You need at least 1.0 FLOW to create a ponder')
      return false
    }

    return true
  }

  const handleCreate = () => {
    if (!validateForm()) return

    const validOptions = options.filter(option => option.trim())
    
    showConfirmation(
      'Create Ponder',
      `Are you sure you want to create this ponder? It will cost 1.0 FLOW to create.`,
      () => createPonder(),
      () => {}
    )
  }

  const createPonder = async () => {
    try {
      setIsCreating(true)
      
      const validOptions = options.filter(option => option.trim())
      
      const result = await flowService.createPonder({
        question: question.trim(),
        description: description.trim(),
        options: validOptions,
        durationHours: parseFloat(duration),
        minBet: parseFloat(minBet),
        maxBet: parseFloat(maxBet),
        category: category
      })

      if (result.success) {
        showSuccess('Ponder created successfully!')
        
        // Reset form
        setQuestion('')
        setDescription('')
        setOptions(['', ''])
        setCategory('')
        setDuration('24')
        setMinBet('0.50')
        setMaxBet('100.00')
        
        // Navigate back to ponders screen
        navigation.navigate('Ponders')
      } else {
        showError(result.error || 'Failed to create ponder')
      }
    } catch (error) {
      console.error('Create ponder error:', error)
      showError('Failed to create ponder')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question</Text>
            <Text style={styles.sectionDescription}>
              What would you like people to predict?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Will Bitcoin reach $100K by end of 2024?"
              placeholderTextColor={theme.colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {question.length}/500 characters
            </Text>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Provide additional context or details
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Add any relevant details, sources, or criteria..."
              placeholderTextColor={theme.colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Options Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Answer Options</Text>
            <Text style={styles.sectionDescription}>
              What are the possible outcomes?
            </Text>
            
            {options.map((option, index) => (
              <View key={index} style={styles.optionContainer}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={option}
                  onChangeText={(value) => updateOption(index, value)}
                />
                {options.length > 2 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeOption(index)}
                  >
                    <Icon name="close-circle" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < 10 && (
              <TouchableOpacity style={styles.addButton} onPress={addOption}>
                <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>Add Option</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <Text style={styles.sectionDescription}>
              How long should voting be open?
            </Text>
            <View style={styles.durationContainer}>
              {durationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationChip,
                    duration === option.value && styles.durationChipSelected
                  ]}
                  onPress={() => setDuration(option.value)}
                >
                  <Text style={[
                    styles.durationText,
                    duration === option.value && styles.durationTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Betting Limits Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Betting Limits</Text>
            <Text style={styles.sectionDescription}>
              Set minimum and maximum bet amounts
            </Text>
            
            <View style={styles.betContainer}>
              <View style={styles.betInputContainer}>
                <Text style={styles.betLabel}>Min Bet ($)</Text>
                <TextInput
                  style={styles.betInput}
                  placeholder="0.50"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={minBet}
                  onChangeText={setMinBet}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.betInputContainer}>
                <Text style={styles.betLabel}>Max Bet ($)</Text>
                <TextInput
                  style={styles.betInput}
                  placeholder="100.00"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={maxBet}
                  onChangeText={setMaxBet}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Summary Section */}
          <View style={[styles.section, styles.summarySection]}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Creation Fee:</Text>
                <Text style={styles.summaryValue}>1.0 FLOW</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Your Balance:</Text>
                <Text style={[
                  styles.summaryValue,
                  balance < 1.0 && styles.insufficientBalance
                ]}>
                  {balance.toFixed(2)} FLOW
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Platform Fee:</Text>
                <Text style={styles.summaryValue}>2.5% of winnings</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (isCreating || balance < 1.0) && styles.createButtonDisabled
            ]}
            onPress={handleCreate}
            disabled={isCreating || balance < 1.0}
          >
            <LinearGradient
              colors={
                isCreating || balance < 1.0 
                  ? [theme.colors.gray, theme.colors.gray]
                  : [theme.colors.primary, theme.colors.primaryLight]
              }
              style={styles.createButtonGradient}
            >
              {isCreating ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Icon name="rocket" size={20} color={theme.colors.white} />
                  <Text style={styles.createButtonText}>
                    Create Ponder
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  keyboardContainer: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  section: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 60
  },
  characterCount: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  optionInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  removeButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginTop: theme.spacing.sm
  },
  addButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.lightGray,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  categoryTextSelected: {
    color: theme.colors.white
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  durationChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.lightGray,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  durationChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  durationText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary
  },
  durationTextSelected: {
    color: theme.colors.white
  },
  betContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  betInputContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs
  },
  betLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  betInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  summarySection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    ...theme.shadows.sm
  },
  summaryContainer: {
    marginTop: theme.spacing.sm
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text
  },
  insufficientBalance: {
    color: theme.colors.error
  },
  createButtonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border
  },
  createButton: {
    borderRadius: theme.borderRadius.lg
  },
  createButtonDisabled: {
    opacity: 0.6
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg
  },
  createButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white
  }
})

export default CreateScreen