// Onboarding Screen - Welcome and wallet connection
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const { width, height } = Dimensions.get('window')

const OnboardingScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const { signIn } = useAuth()
  const { requestPermissions, showError } = useNotification()

  const slides = [
    {
      title: 'Predict the Future',
      subtitle: 'Make predictions on anything and earn rewards for being right',
      icon: 'trending-up',
      description: 'From sports to politics, crypto to entertainment - predict outcomes and put your knowledge to the test.'
    },
    {
      title: 'Powered by Flow',
      subtitle: 'Fast, cheap, and secure blockchain technology',
      icon: 'flash',
      description: 'Built on Flow blockchain with instant transactions, minimal fees, and enterprise-grade security.'
    },
    {
      title: 'Earn Real Rewards',
      subtitle: 'Win USDC for accurate predictions',
      icon: 'trophy',
      description: 'Compete with others, climb the leaderboard, and earn cryptocurrency rewards for your insights.'
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleConnectWallet()
    }
  }

  const handleSkip = () => {
    handleConnectWallet()
  }

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      
      // Request notification permissions first
      await requestPermissions()
      
      // Connect wallet
      const result = await signIn()
      
      if (!result.success) {
        showError(result.error || 'Failed to connect wallet')
      }
      // Navigation will happen automatically via AuthContext
      
    } catch (error) {
      console.error('Wallet connection failed:', error)
      showError('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const renderSlide = (slide, index) => (
    <View key={index} style={styles.slide}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryLight]}
          style={styles.iconGradient}
        >
          <Icon name={slide.icon} size={60} color={theme.colors.white} />
        </LinearGradient>
      </View>
      
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.subtitle}>{slide.subtitle}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  )

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentSlide && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slide = Math.ceil(event.nativeEvent.contentOffset.x / width)
          setCurrentSlide(slide)
        }}
        style={styles.scrollView}
      >
        {slides.map(renderSlide)}
      </ScrollView>

      {renderPagination()}

      <View style={styles.bottomSection}>
        {currentSlide < slides.length - 1 ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryLight]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextText}>Next</Text>
                <Icon name="arrow-forward" size={20} color={theme.colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectWallet}
            disabled={isConnecting}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              style={styles.connectButtonGradient}
            >
              {isConnecting ? (
                <Text style={styles.connectText}>Connecting...</Text>
              ) : (
                <>
                  <Icon name="wallet" size={24} color={theme.colors.white} />
                  <Text style={styles.connectText}>Connect Wallet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Icon name="shield-checkmark" size={20} color={theme.colors.success} />
            <Text style={styles.featureText}>Secure & Decentralized</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="flash" size={20} color={theme.colors.warning} />
            <Text style={styles.featureText}>Instant Transactions</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="cash" size={20} color={theme.colors.primary} />
            <Text style={styles.featureText}>Real Rewards</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollView: {
    flex: 1
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl
  },
  iconContainer: {
    marginBottom: theme.spacing.xl
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    paddingHorizontal: theme.spacing.md
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4
  },
  paginationDotActive: {
    backgroundColor: theme.colors.primary,
    width: 24
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg
  },
  skipText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium
  },
  nextButton: {
    borderRadius: theme.borderRadius.full
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full
  },
  nextText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
    marginRight: theme.spacing.sm
  },
  connectButton: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg
  },
  connectText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md
  },
  feature: {
    alignItems: 'center',
    flex: 1
  },
  featureText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center'
  },
  disclaimer: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xs
  }
})

export default OnboardingScreen