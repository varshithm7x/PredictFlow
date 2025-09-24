// Authentication Context - Manages user wallet connection and authentication
import React, { createContext, useContext, useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import flowService from '../services/FlowService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = fcl.currentUser.subscribe(setUser)
    
    // Check initial auth state
    checkAuthState()
    
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Update balance when user changes
    if (user?.addr) {
      updateBalance()
    }
  }, [user?.addr])

  const checkAuthState = async () => {
    try {
      const currentUser = await flowService.getCurrentUser()
      if (currentUser?.loggedIn) {
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to check auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async () => {
    try {
      setIsLoading(true)
      const user = await flowService.authenticate()
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await flowService.signOut()
      setUser(null)
      setBalance(0)
      return { success: true }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, error: error.message }
    }
  }

  const updateBalance = async () => {
    if (!user?.addr) return
    
    try {
      const result = await flowService.getFlowBalance(user.addr)
      if (result.success) {
        setBalance(result.data)
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  const value = {
    user,
    balance,
    isLoading,
    signIn,
    signOut,
    updateBalance,
    isAuthenticated: !!user?.loggedIn
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext