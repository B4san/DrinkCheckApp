import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Neumorphic color palette - monochromatic with subtle variations
export const neumorphicColors = {
  background: '#e0e0e0',
  surface: '#e0e0e0',
  surfacePressed: '#d6d6d6',
  shadowLight: '#ffffff',
  shadowDark: '#a3a3a3',
  textPrimary: '#4a4a4a',
  textSecondary: '#6b6b6b',
  textTertiary: '#8a8a8a',
  accent: '#c0c0c0',
  accentPressed: '#b4b4b4',
  alert: '#d89898',
  alertPressed: '#d18a8a',
  success: '#98d8a8',
  successPressed: '#8ad198',
};

// Base neumorphic shadow style for elevated elements
export const neumorphicShadow = {
  shadowColor: neumorphicColors.shadowDark,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 6,
  // Additional light shadow effect for iOS
  shadowOffset2: { width: -3, height: -3 },
  shadowColor2: neumorphicColors.shadowLight,
  shadowOpacity2: 0.8,
  shadowRadius2: 6,
} as const;

// Base neumorphic shadow style for pressed/inset elements
export const neumorphicShadowInset = {
  shadowColor: neumorphicColors.shadowLight,
  shadowOffset: { width: -2, height: -2 },
  shadowOpacity: 0.8,
  shadowRadius: 4,
  elevation: 2,
  // Additional dark shadow for inset effect
  shadowOffset2: { width: 2, height: 2 },
  shadowColor2: neumorphicColors.shadowDark,
  shadowOpacity2: 0.3,
  shadowRadius2: 4,
} as const;

// Utility function to create neumorphic container styles
export const createNeumorphicStyle = (options: {
  pressed?: boolean;
  size?: 'small' | 'medium' | 'large';
  borderRadius?: number;
}): ViewStyle => {
  const { pressed = false, size = 'medium', borderRadius = 12 } = options;
  
  const sizeStyles = {
    small: { padding: 8 },
    medium: { padding: 16 },
    large: { padding: 20 },
  };

  return {
    backgroundColor: pressed ? neumorphicColors.surfacePressed : neumorphicColors.surface,
    borderRadius,
    ...sizeStyles[size],
    // Primary shadow (dark, bottom-right)
    shadowColor: pressed ? neumorphicColors.shadowLight : neumorphicColors.shadowDark,
    shadowOffset: pressed ? { width: -2, height: -2 } : { width: 3, height: 3 },
    shadowOpacity: pressed ? 0.8 : 0.3,
    shadowRadius: pressed ? 4 : 6,
    elevation: pressed ? 2 : 6,
  };
};

// Utility function to create neumorphic button styles
export const createNeumorphicButtonStyle = (options: {
  pressed?: boolean;
  variant?: 'primary' | 'secondary' | 'alert' | 'success';
  size?: 'small' | 'medium' | 'large';
}): ViewStyle => {
  const { pressed = false, variant = 'primary', size = 'medium' } = options;
  
  const sizeStyles = {
    small: { paddingHorizontal: 12, paddingVertical: 8 },
    medium: { paddingHorizontal: 16, paddingVertical: 12 },
    large: { paddingHorizontal: 20, paddingVertical: 16 },
  };

  const variantColors = {
    primary: pressed ? neumorphicColors.accentPressed : neumorphicColors.accent,
    secondary: pressed ? neumorphicColors.surfacePressed : neumorphicColors.surface,
    alert: pressed ? neumorphicColors.alertPressed : neumorphicColors.alert,
    success: pressed ? neumorphicColors.successPressed : neumorphicColors.success,
  };

  return {
    backgroundColor: variantColors[variant],
    borderRadius: 8,
    ...sizeStyles[size],
    shadowColor: pressed ? neumorphicColors.shadowLight : neumorphicColors.shadowDark,
    shadowOffset: pressed ? { width: -2, height: -2 } : { width: 3, height: 3 },
    shadowOpacity: pressed ? 0.8 : 0.3,
    shadowRadius: pressed ? 4 : 6,
    elevation: pressed ? 2 : 6,
    alignItems: 'center',
    justifyContent: 'center',
  };
};

// Common neumorphic text styles
export const neumorphicTextStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: neumorphicColors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    color: neumorphicColors.textSecondary,
  } as TextStyle,
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: neumorphicColors.textPrimary,
    marginBottom: 16,
  } as TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.textPrimary,
    marginBottom: 8,
  } as TextStyle,
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: neumorphicColors.textPrimary,
  } as TextStyle,
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: neumorphicColors.textPrimary,
    marginBottom: 4,
  } as TextStyle,
  smallText: {
    fontSize: 12,
    color: neumorphicColors.textTertiary,
  } as TextStyle,
});

// Pre-defined neumorphic component styles
export const neumorphicStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neumorphicColors.background,
  } as ViewStyle,
  contentContainer: {
    padding: 16,
    paddingTop: 60,
  } as ViewStyle,
  card: createNeumorphicStyle({ size: 'medium' }),
  cardSmall: createNeumorphicStyle({ size: 'small' }),
  cardLarge: createNeumorphicStyle({ size: 'large' }),
  button: createNeumorphicButtonStyle({ variant: 'primary' }),
  buttonSecondary: createNeumorphicButtonStyle({ variant: 'secondary' }),
  buttonAlert: createNeumorphicButtonStyle({ variant: 'alert' }),
  buttonSuccess: createNeumorphicButtonStyle({ variant: 'success' }),
  input: {
    backgroundColor: neumorphicColors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: neumorphicColors.textPrimary,
    shadowColor: neumorphicColors.shadowLight,
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
});