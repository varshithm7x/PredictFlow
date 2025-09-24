// Theme Configuration
export const theme = {
  colors: {
    // Primary colors
    primary: '#6366F1',        // Indigo - main brand color
    primaryLight: '#8B87FF',   // Lighter indigo
    primaryDark: '#4F46E5',    // Darker indigo
    
    // Secondary colors
    secondary: '#10B981',      // Emerald - for success/wins
    secondaryLight: '#34D399', // Lighter emerald
    secondaryDark: '#059669',  // Darker emerald
    
    // Status colors
    success: '#10B981',        // Green
    error: '#EF4444',          // Red
    warning: '#F59E0B',        // Amber
    info: '#3B82F6',          // Blue
    
    // Neutral colors
    background: '#FAFAFA',     // Very light gray
    surface: '#FFFFFF',        // White
    surfaceVariant: '#F5F5F5', // Light gray
    
    // Text colors
    text: '#111827',           // Dark gray
    textSecondary: '#6B7280',  // Medium gray
    textTertiary: '#9CA3AF',   // Light gray
    
    // Border colors
    border: '#E5E7EB',         // Light border
    borderLight: '#F3F4F6',    // Very light border
    
    // Utility colors
    white: '#FFFFFF',
    black: '#000000',
    gray: '#6B7280',
    lightGray: '#F9FAFB',
    darkGray: '#374151',
    
    // Ponder-specific colors
    votingGreen: '#22C55E',    // For positive/yes votes
    votingRed: '#EF4444',      // For negative/no votes
    votingBlue: '#3B82F6',     // For neutral votes
    juicedGold: '#F59E0B',     // For featured/juiced ponders
    
    // Pool colors (for different betting amounts)
    pool050: '#FEF3C7',        // $0.50 pool - light yellow
    pool100: '#DBEAFE',        // $1.00 pool - light blue
    pool500: '#FDE68A',        // $5.00 pool - light orange
    
    // Gradient colors
    gradientStart: '#6366F1',
    gradientEnd: '#8B87FF'
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
  },
  
  typography: {
    // Font sizes
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32
    },
    
    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    }
  }
}

// Utility functions for theme
export const getPoolColor = (amount) => {
  if (amount <= 0.5) return theme.colors.pool050
  if (amount <= 1.0) return theme.colors.pool100
  return theme.colors.pool500
}

export const getVotingColor = (option, optionCount) => {
  if (optionCount === 2) {
    return option === 0 ? theme.colors.votingGreen : theme.colors.votingRed
  }
  
  // For multiple options, cycle through colors
  const colors = [
    theme.colors.votingGreen,
    theme.colors.votingRed,
    theme.colors.votingBlue,
    theme.colors.warning,
    theme.colors.secondary
  ]
  
  return colors[option % colors.length]
}

export const formatAmount = (amount) => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`
  }
  return `$${amount.toFixed(2)}`
}

export const formatTime = (timestamp) => {
  const now = new Date().getTime() / 1000
  const diff = timestamp - now
  
  if (diff < 0) return 'Ended'
  
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  
  return `${minutes}m`
}