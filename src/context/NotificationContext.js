// Notification Context - Manages push notifications and alerts
import React, { createContext, useContext, useEffect, useState } from 'react'
import PushNotification from 'react-native-push-notification'
import { Platform, Alert, Linking } from 'react-native'

const NotificationContext = createContext({})

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [permissions, setPermissions] = useState(false)

  useEffect(() => {
    initializeNotifications()
  }, [])

  const initializeNotifications = async () => {
    try {
      PushNotification.configure({
        // iOS permissions
        onRegister: function (token) {
          console.log('Push notification token:', token)
        },

        // Called when a remote notification is received
        onNotification: function (notification) {
          console.log('Notification received:', notification)

          if (notification.userInteraction) {
            // User tapped on notification
            handleNotificationTap(notification)
          }

          // Required for iOS
          notification.finish('UIBackgroundFetchResultNewData')
        },

        // Should the initial notification be popped automatically
        popInitialNotification: true,

        // iOS settings
        requestPermissions: Platform.OS === 'ios'
      })

      // Check permissions
      checkPermissions()
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  const checkPermissions = () => {
    PushNotification.checkPermissions((permissions) => {
      setPermissions(permissions.alert && permissions.badge)
    })
  }

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      PushNotification.requestPermissions()
        .then((permissions) => {
          setPermissions(permissions.alert && permissions.badge)
        })
        .catch((error) => {
          console.error('Permission request failed:', error)
        })
    } else {
      setPermissions(true)
    }
  }

  const handleNotificationTap = (notification) => {
    const { data } = notification

    if (data?.type === 'ponder_resolved') {
      // Navigate to ponder detail
      // This would use navigation service
    } else if (data?.type === 'ponder_ending_soon') {
      // Navigate to ponder list
    }
  }

  // Show local notification
  const showLocalNotification = (title, message, data = {}) => {
    PushNotification.localNotification({
      title,
      message,
      playSound: true,
      soundName: 'default',
      userInfo: data
    })
  }

  // Schedule notification
  const scheduleNotification = (title, message, date, data = {}) => {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date: new Date(date),
      playSound: true,
      soundName: 'default',
      userInfo: data
    })
  }

  // Notification types for FlowPonder
  const notifyPonderResolved = (ponderTitle, won, amount) => {
    const title = won ? '🎉 You Won!' : '📉 Ponder Resolved'
    const message = won
      ? `You won $${amount.toFixed(2)} on "${ponderTitle}"!`
      : `"${ponderTitle}" has been resolved.`

    showLocalNotification(title, message, {
      type: 'ponder_resolved',
      won,
      amount
    })
  }

  const notifyPonderEndingSoon = (ponderTitle, timeLeft) => {
    showLocalNotification(
      '⏰ Ponder Ending Soon',
      `"${ponderTitle}" ends in ${timeLeft}. Place your vote now!`,
      { type: 'ponder_ending_soon' }
    )
  }

  const notifyNewFeaturedPonder = (ponderTitle) => {
    showLocalNotification(
      '🔥 New Featured Ponder',
      `Check out the juiced ponder: "${ponderTitle}"`,
      { type: 'featured_ponder' }
    )
  }

  const notifyLeaderboardChange = (newRank) => {
    showLocalNotification(
      '📊 Leaderboard Update',
      `You're now ranked #${newRank} on the leaderboard!`,
      { type: 'leaderboard_change' }
    )
  }

  // Show alert dialog
  const showAlert = (title, message, buttons = []) => {
    const defaultButtons = [{ text: 'OK', style: 'default' }]
    Alert.alert(title, message, buttons.length > 0 ? buttons : defaultButtons)
  }

  // Show confirmation dialog
  const showConfirmation = (title, message, onConfirm, onCancel) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', style: 'default', onPress: onConfirm }
      ]
    )
  }

  // Show success message
  const showSuccess = (message) => {
    showAlert('Success', message)
  }

  // Show error message
  const showError = (message) => {
    showAlert('Error', message)
  }

  // Open settings for permissions
  const openSettings = () => {
    Linking.openSettings()
  }

  const value = {
    isInitialized,
    permissions,
    requestPermissions,
    showLocalNotification,
    scheduleNotification,
    notifyPonderResolved,
    notifyPonderEndingSoon,
    notifyNewFeaturedPonder,
    notifyLeaderboardChange,
    showAlert,
    showConfirmation,
    showSuccess,
    showError,
    openSettings
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext