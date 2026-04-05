import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl } from '../config/api'

export const accountTypeOptions = ['Savings', 'Current', 'Fixed Deposit', 'Recurring Deposit']
export const accountStatusOptions = ['Active', 'Frozen', 'Closed']
export const transactionTypeOptions = ['Credit', 'Debit']
export const transactionChannelOptions = [
  'ATM',
  'Online Banking',
  'Branch Counter',
  'POS Terminal',
  'UPI',
  'NEFT',
  'RTGS',
  'IMPS',
]
export const loanPaymentMethodOptions = [
  'Online Banking',
  'Branch Counter',
  'Auto-Debit',
  'Cheque',
]

export const sidebarItems = [
  { id: 'overview', label: 'Overview', path: '/dashboard' },
  { id: 'accounts', label: 'Accounts', path: '/dashboard/accounts' },
  { id: 'transactions', label: 'Transactions', path: '/dashboard/transactions' },
  { id: 'cards', label: 'Cards', path: '/dashboard/cards' },
  { id: 'loans', label: 'Loans', path: '/dashboard/loans' },
  { id: 'transfers', label: 'Transfers', path: '/dashboard/transfers' },
  { id: 'profile', label: 'Profile', path: '/dashboard/profile' },
]

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
  const [accountForm, setAccountForm] = useState({
    account_type: accountTypeOptions[0],
  })
  const [transactionForm, setTransactionForm] = useState({
    account_id: '',
    transaction_type: transactionTypeOptions[0],
    transaction_amount: '',
    transaction_channel: transactionChannelOptions[0],
    transaction_desc: '',
  })
  const [transferForm, setTransferForm] = useState({
    sender_account_id: '',
    destination_account_number: '',
    transfer_amount: '',
    transfer_remarks: '',
    password: '',
  })
  const [loanApplicationForm, setLoanApplicationForm] = useState({
    loan_type: '',
    requested_amount: '',
    tenure_months: '',
    purpose: '',
    linked_account_id: '',
  })
  const [repaymentForm, setRepaymentForm] = useState({
    loan_id: '',
    source_account_id: '',
    repayment_amount: '',
    payment_method: loanPaymentMethodOptions[0],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isUpdatingAccountStatus, setIsUpdatingAccountStatus] = useState(false)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)
  const [isSubmittingLoanApplication, setIsSubmittingLoanApplication] = useState(false)
  const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false)
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

  const syncTransactionForm = (accounts) => {
    setTransactionForm((current) => ({
      ...current,
      account_id:
        accounts?.some((account) => String(account.account_id) === String(current.account_id))
          ? current.account_id
          : String(
              accounts?.find((account) => account.account_status === 'Active')?.account_id ||
                accounts?.[0]?.account_id ||
                ''
            ),
    }))

    setTransferForm((current) => ({
      ...current,
      sender_account_id:
        accounts?.some((account) => String(account.account_id) === String(current.sender_account_id))
          ? current.sender_account_id
          : String(
              accounts?.find((account) => account.account_status === 'Active')?.account_id ||
                accounts?.[0]?.account_id ||
                ''
            ),
    }))
  }

  const syncLoanForms = (accounts, loans, loanTypes, paymentMethods) => {
    const activeAccounts = accounts?.filter((account) => account.account_status === 'Active') || []
    const activeLoans = loans?.filter((loan) => loan.loan_status === 'Active') || []

    setLoanApplicationForm((current) => ({
      ...current,
      loan_type:
        loanTypes?.includes(current.loan_type) && current.loan_type
          ? current.loan_type
          : loanTypes?.[0] || '',
      linked_account_id:
        activeAccounts.some((account) => String(account.account_id) === String(current.linked_account_id))
          ? current.linked_account_id
          : String(activeAccounts[0]?.account_id || accounts?.[0]?.account_id || ''),
    }))

    setRepaymentForm((current) => ({
      ...current,
      loan_id:
        activeLoans.some((loan) => String(loan.loan_id) === String(current.loan_id))
          ? current.loan_id
          : String(activeLoans[0]?.loan_id || ''),
      source_account_id:
        activeAccounts.some((account) => String(account.account_id) === String(current.source_account_id))
          ? current.source_account_id
          : String(activeAccounts[0]?.account_id || accounts?.[0]?.account_id || ''),
      payment_method:
        paymentMethods?.includes(current.payment_method) && current.payment_method
          ? current.payment_method
          : paymentMethods?.[0] || loanPaymentMethodOptions[0],
    }))
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
      syncTransactionForm(data.accounts)
      syncLoanForms(data.accounts, data.loans, data.loan_types, data.loan_payment_methods)
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

  const handleAccountFormChange = (event) => {
    const { name, value } = event.target
    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    setIsCreatingAccount(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/accounts/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: accountForm.account_type,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account.')
      }

      setSuccess(data.message || 'New account created successfully.')
      setAccountForm({
        account_type: accountTypeOptions[0],
      })
      await loadDashboard()

      const newAccount = data.account
      const hasOtherActiveSource = dashboard?.accounts?.some(
        (account) =>
          account.account_status === 'Active' &&
          String(account.account_id) !== String(newAccount?.account_id)
      )

      if (
        newAccount &&
        window.confirm(
          'Account created with zero balance. Do you want to transfer money into this new account now?'
        )
      ) {
        if (hasOtherActiveSource) {
          setTransferForm((current) => ({
            ...current,
            sender_account_id:
              String(
                dashboard?.accounts?.find(
                  (account) =>
                    account.account_status === 'Active' &&
                    String(account.account_id) !== String(newAccount.account_id)
                )?.account_id || ''
              ),
            destination_account_number: newAccount.account_number || '',
            transfer_amount: '',
            transfer_remarks: `Initial funding for ${newAccount.account_number}`,
            password: '',
          }))

          window.alert('The transfer form has been prepared below in the Accounts tab.')
        } else {
          window.alert('No other active account is available to fund this new account yet.')
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while creating the account.'
      )
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleAccountStatusChange = async (accountId, accountStatus) => {
    setIsUpdatingAccountStatus(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/accounts/${accountId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_status: accountStatus,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update account status.')
      }

      setSuccess(data.message || 'Account status updated successfully.')
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while updating account status.'
      )
    } finally {
      setIsUpdatingAccountStatus(false)
    }
  }

  const handleTransactionFormChange = (event) => {
    const { name, value } = event.target
    setTransactionForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleTransactionSubmit = async (event) => {
    event.preventDefault()
    setIsSubmittingTransaction(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/transactions/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_id: Number(transactionForm.account_id),
          transaction_type: transactionForm.transaction_type,
          transaction_amount:
            transactionForm.transaction_amount === ''
              ? 0
              : Number(transactionForm.transaction_amount),
          transaction_channel: transactionForm.transaction_channel,
          transaction_desc: transactionForm.transaction_desc,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit transaction.')
      }

      setSuccess(data.message || 'Transaction recorded successfully.')
      setTransactionForm((current) => ({
        ...current,
        transaction_amount: '',
        transaction_desc: '',
      }))
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while submitting transaction.'
      )
    } finally {
      setIsSubmittingTransaction(false)
    }
  }

  const handleTransferFormChange = (event) => {
    const { name, value } = event.target
    setTransferForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const prepareOwnAccountTransfer = (destinationAccountNumber, destinationAccountId = '') => {
    const accounts = dashboard?.accounts || []
    const sourceAccount = accounts.find(
      (account) =>
        account.account_status === 'Active' &&
        String(account.account_id) !== String(destinationAccountId)
    )

    setTransferForm((current) => ({
      ...current,
      sender_account_id: String(sourceAccount?.account_id || current.sender_account_id || ''),
      destination_account_number: destinationAccountNumber || current.destination_account_number || '',
      transfer_amount: '',
      transfer_remarks:
        destinationAccountNumber && current.destination_account_number !== destinationAccountNumber
          ? `Transfer to ${destinationAccountNumber}`
          : current.transfer_remarks,
      password: '',
    }))
  }

  const handleTransferSubmit = async (event) => {
    event.preventDefault()
    setIsSubmittingTransfer(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/transfers/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sender_account_id: Number(transferForm.sender_account_id),
          destination_account_number: transferForm.destination_account_number,
          transfer_amount: transferForm.transfer_amount === '' ? 0 : Number(transferForm.transfer_amount),
          transfer_remarks: transferForm.transfer_remarks,
          password: transferForm.password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit transfer.')
      }

      setSuccess(data.message || 'Transfer successful.')
      setTransferForm((current) => ({
        ...current,
        destination_account_number: '',
        transfer_amount: '',
        transfer_remarks: '',
        password: '',
      }))
      await loadDashboard()
      window.alert(data.message || 'Transfer successful.')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while submitting transfer.'
      )
    } finally {
      setIsSubmittingTransfer(false)
    }
  }

  const handleLoanApplicationFormChange = (event) => {
    const { name, value } = event.target
    setLoanApplicationForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleLoanApplicationSubmit = async (event) => {
    event.preventDefault()
    setIsSubmittingLoanApplication(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/customers/me/loan-applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          loan_type: loanApplicationForm.loan_type,
          requested_amount:
            loanApplicationForm.requested_amount === ''
              ? 0
              : Number(loanApplicationForm.requested_amount),
          tenure_months:
            loanApplicationForm.tenure_months === ''
              ? 0
              : Number(loanApplicationForm.tenure_months),
          purpose: loanApplicationForm.purpose,
          linked_account_id: Number(loanApplicationForm.linked_account_id),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit the loan application.')
      }

      setSuccess(data.message || 'Loan application submitted successfully.')
      setLoanApplicationForm((current) => ({
        ...current,
        requested_amount: '',
        tenure_months: '',
        purpose: '',
      }))
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while submitting the loan application.'
      )
    } finally {
      setIsSubmittingLoanApplication(false)
    }
  }

  const handleRepaymentFormChange = (event) => {
    const { name, value } = event.target
    setRepaymentForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleLoanRepaymentSubmit = async (event) => {
    event.preventDefault()
    setIsSubmittingRepayment(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${apiBaseUrl}/customers/me/loans/${Number(repaymentForm.loan_id)}/repay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            source_account_id: Number(repaymentForm.source_account_id),
            repayment_amount:
              repaymentForm.repayment_amount === ''
                ? 0
                : Number(repaymentForm.repayment_amount),
            payment_method: repaymentForm.payment_method,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record the loan repayment.')
      }

      setSuccess(data.message || 'Loan repayment recorded successfully.')
      setRepaymentForm((current) => ({
        ...current,
        repayment_amount: '',
      }))
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while recording the loan repayment.'
      )
    } finally {
      setIsSubmittingRepayment(false)
    }
  }

  return {
    dashboard,
    profileForm,
    accountForm,
    transactionForm,
    transferForm,
    loanApplicationForm,
    repaymentForm,
    isLoading,
    isSaving,
    isCreatingAccount,
    isUpdatingAccountStatus,
    isSubmittingTransaction,
    isSubmittingTransfer,
    isSubmittingLoanApplication,
    isSubmittingRepayment,
    error,
    success,
    storedUser,
    handleLogout,
    handleProfileChange,
    handleProfileSubmit,
    handleAccountFormChange,
    handleCreateAccount,
    handleAccountStatusChange,
    handleTransactionFormChange,
    handleTransactionSubmit,
    handleTransferFormChange,
    handleTransferSubmit,
    handleLoanApplicationFormChange,
    handleLoanApplicationSubmit,
    handleRepaymentFormChange,
    handleLoanRepaymentSubmit,
    prepareOwnAccountTransfer,
  }
}
