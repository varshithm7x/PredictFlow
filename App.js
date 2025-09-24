// Main App Component - FlowPonder Entry Point
import React, { useEffect, useState } from 'react'
import { StatusBar, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import Icon from 'react-native-vector-icons/Ionicons'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Screens
import PondersScreen from './src/screens/PondersScreen'
import CreateScreen from './src/screens/CreateScreen'
import LeaderboardScreen from './src/screens/LeaderboardScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import PonderDetailScreen from './src/screens/PonderDetailScreen'
import WalletScreen from './src/screens/WalletScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'

// Services and Context
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { NotificationProvider } from './src/context/NotificationContext'
import flowService from './src/services/FlowService'

// Theme
import { theme } from './src/theme/colors'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Tab Navigator Component
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Ponders') {
            iconName = focused ? 'trending-up' : 'trending-up-outline'
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: 'bold'
        },
        headerTintColor: theme.colors.text
      })}
    >
      <Tab.Screen
        name="Ponders"
        component={PondersScreen}
        options={{
          title: 'Discover',
          headerTitle: 'FlowPonder'
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          title: 'Create',
          headerTitle: 'Create Ponder'
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          title: 'Rankings',
          headerTitle: 'Leaderboard'
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile'
        }}
      />
    </Tab.Navigator>
  )
}

// Main Stack Navigator
const AppNavigator = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null // Or loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          shadowColor: 'transparent',
          elevation: 0
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: 'bold'
        },
        headerTintColor: theme.colors.text,
        cardStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      {!user?.loggedIn ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PonderDetail"
            component={PonderDetailScreen}
            options={({ route }) => ({
              title: route.params?.title || 'Ponder Details',
              headerBackTitleVisible: false
            })}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              title: 'Wallet',
              presentation: 'modal',
              headerBackTitleVisible: false
            }}
          />
        </>
      )}
    </Stack.Navigator>
  )
}

// Main App Component
const App = () => {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Initialize Flow service
      await flowService.initialize('testnet')

      // Setup notifications
      // setupNotifications()

      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize app:', error)
      // Could show error screen here
      setIsInitialized(true)
    }
  }

  if (!isInitialized) {
    return null // Loading screen
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={theme.colors.surface}
            />
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default App