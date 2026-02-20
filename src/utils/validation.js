/**
 * Form validation utilities
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  // Check if it has 10 digits (US format) or valid international format
  return digits.length >= 10 && digits.length <= 15
}

export const validateName = (name) => {
  return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name)
}

export const validateMessage = (message) => {
  return message.trim().length >= 10
}

export const validateForm = (formData) => {
  const errors = {}

  if (!validateName(formData.name)) {
    errors.name = 'Please enter a valid name (at least 2 characters)'
  }

  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  if (!formData.subject || formData.subject.trim().length < 3) {
    errors.subject = 'Please enter a subject (at least 3 characters)'
  }

  if (!validateMessage(formData.message)) {
    errors.message = 'Please enter a message (at least 10 characters)'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '')
  
  // Format UK phone numbers: 020 3368 3036
  // Handle UK landline format
  if (phoneNumber.length === 0) {
    return ''
  } else if (phoneNumber.length <= 2) {
    return phoneNumber
  } else if (phoneNumber.length <= 5) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`
  } else if (phoneNumber.length <= 9) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 7)} ${phoneNumber.slice(7)}`
  } else {
    // For longer numbers (with country code)
    if (phoneNumber.startsWith('44')) {
      const withoutCountry = phoneNumber.slice(2)
      if (withoutCountry.length <= 5) {
        return `+44 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2)}`
      } else {
        return `+44 ${withoutCountry.slice(0, 2)} ${withoutCountry.slice(2, 6)} ${withoutCountry.slice(6, 10)}`
      }
    }
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 7)} ${phoneNumber.slice(7, 11)}`
  }
}
