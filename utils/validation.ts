export interface ValidationResult {
  isValid: boolean
  error?: string
}

type Translator = (text: string) => string

const identityTranslate: Translator = (text) => text

export const validateEmail = (email: string, translate: Translator = identityTranslate): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: translate('Email is required') }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: translate('Please enter a valid email address') }
  }
  
  return { isValid: true }
}

export const validatePassword = (password: string, translate: Translator = identityTranslate): ValidationResult => {
  if (!password) {
    return { isValid: false, error: translate('Password is required') }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: translate('Password must be at least 8 characters long') }
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, error: translate('Password must contain at least one number') }
  }
  
  return { isValid: true }
}

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
  translate: Translator = identityTranslate,
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, error: translate('Please confirm your password') }
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: translate('Passwords do not match') }
  }
  
  return { isValid: true }
}

export const validateFullName = (name: string, translate: Translator = identityTranslate): ValidationResult => {
  if (!name) {
    return { isValid: false, error: translate('Full name is required') }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: translate('Full name must be at least 2 characters') }
  }
  
  return { isValid: true }
}

export const mapSupabaseError = (error: any, translate: Translator = identityTranslate): string => {
  const message = error?.message || ''
  
  if (message.includes('already registered')) {
    return translate('This email is already registered. Please log in instead.')
  }
  
  if (message.includes('Invalid login credentials')) {
    return translate('Invalid email or password. Please try again.')
  }
  
  if (message.includes('Email not confirmed')) {
    return translate('Please verify your email before logging in.')
  }
  
  if (message.includes('rate limit')) {
    return translate('Too many attempts. Please try again later.')
  }
  
  return translate(message || 'An unexpected error occurred. Please try again.')
}
