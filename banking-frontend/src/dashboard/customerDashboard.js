import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const sidebarItems = [
  { id: 'overview', label: 'Overview', path: '/dashboard' },
  { id: 'accounts', label: 'Accounts', path: '/dashboard/accounts' },
  { id: 'transactions', label: 'Transactions', path: '/dashboard/transactions' },
  { id: 'cards', label: 'Cards', path: '/dashboard/cards' },
  { id: 'loans', label: 'Loans', path: '/dashboard/loans' },
  { id: 'transfers', label: 'Transfers', path: '/dashboard/transfers' },
  { id: 'profile', label: 'Profile', path: '/dashboard/profile' },
]

const apiBaseUrl = 'http://localhost:5000/api'

export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

export const formatDate = (value, options = {}) => {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(value))
}

export const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || 'CU'

export function useCustomerDashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    customer_city: '',
    customer_state: '',
    pincode: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('bank_user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const token = localStorage.getItem('token')

  const syncProfileForm = (profile) => {
    setProfileForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      customer_phone: profile?.customer_phone || '',
      customer_email: profile?.customer_email || '',
      customer_address: profile?.customer_address || '',
      customer_city: profile?.customer_city || '',
      customer_state: profile?.customer_state || '',
      pincode: profile?.pincode || '',
    })
  }

  const loadDashboard = async () => {
    if (!token) {
      navigate('/')
      return
    }

    if (storedUser?.user_role && storedUser.user_role !== 'customer') {
      setIsLoading(false)
      setError('This dashboard is configured for customer logins. Please sign in with a customer account.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/customers/me/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load your dashboard.')
      }

      setDashboard(data)
      syncProfileForm(data.profile)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while loading the dashboard.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('bank_user')
    navigate('/')
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/customers/me/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed.')
      }

      setSuccess(data.message || 'Profile updated successfully.')
      setDashboard((current) =>
        current
          ? {
              ...current,
              profile: data.profile || current.profile,
            }
          : current
      )

      if (data.profile) {
        syncProfileForm(data.profile)
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while updating your profile.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    dashboard,
    profileForm,
    isLoading,
    isSaving,
    error,
    success,
    storedUser,
    handleLogout,
    handleProfileChange,
    handleProfileSubmit,
  }
}
