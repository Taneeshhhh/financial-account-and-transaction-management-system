import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const adminTransactionTypeOptions = ['Credit', 'Debit']

const apiBaseUrl = 'http://localhost:5000/api'

export function useAdminDashboard() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [transactionForm, setTransactionForm] = useState({
    account_id: '',
    transaction_type: adminTransactionTypeOptions[0],
    transaction_amount: '',
    transaction_desc: '',
  })
  const [loanReviewForms, setLoanReviewForms] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)
  const [isReviewingLoanId, setIsReviewingLoanId] = useState(null)
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
  }

  const syncLoanReviewForms = (applications) => {
    setLoanReviewForms((current) => {
      const next = {}

      applications?.forEach((application) => {
        const currentForm = current[String(application.loan_application_id)] || {}
        next[String(application.loan_application_id)] = {
          approved_amount:
            currentForm.approved_amount !== undefined
              ? currentForm.approved_amount
              : String(application.requested_amount || ''),
          annual_interest_rate:
            currentForm.annual_interest_rate !== undefined
              ? currentForm.annual_interest_rate
              : String(application.annual_interest_rate || ''),
          review_notes: currentForm.review_notes || '',
        }
      })

      return next
    })
  }

  const loadDashboard = async () => {
    if (!token) {
      navigate('/admin-login')
      return
    }

    if (storedUser?.user_role && storedUser.user_role !== 'admin') {
      setIsLoading(false)
      setError('This dashboard is restricted to admin logins. Please sign in as an accountant.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/admin/me/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load the admin dashboard.')
      }

      setDashboard(data)
      syncTransactionForm(data.accounts)
      syncLoanReviewForms(data.pending_loan_applications)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while loading the admin dashboard.'
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
    navigate('/admin-login')
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
      const response = await fetch(
        `${apiBaseUrl}/admin/accounts/${Number(transactionForm.account_id)}/counter-transaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            transaction_type: transactionForm.transaction_type,
            transaction_amount:
              transactionForm.transaction_amount === ''
                ? 0
                : Number(transactionForm.transaction_amount),
            transaction_desc: transactionForm.transaction_desc,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record the counter transaction.')
      }

      setSuccess(data.message || 'Counter transaction recorded successfully.')
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
          : 'Something went wrong while recording the counter transaction.'
      )
    } finally {
      setIsSubmittingTransaction(false)
    }
  }

  const handleLoanReviewFieldChange = (applicationId, event) => {
    const { name, value } = event.target

    setLoanReviewForms((current) => ({
      ...current,
      [String(applicationId)]: {
        ...current[String(applicationId)],
        [name]: value,
      },
    }))
  }

  const handleLoanReviewAction = async (applicationId, action) => {
    const form = loanReviewForms[String(applicationId)] || {}

    setIsReviewingLoanId(applicationId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${apiBaseUrl}/admin/loan-applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          approved_amount:
            form.approved_amount === '' || form.approved_amount === undefined
              ? ''
              : Number(form.approved_amount),
          annual_interest_rate:
            form.annual_interest_rate === '' || form.annual_interest_rate === undefined
              ? ''
              : Number(form.annual_interest_rate),
          review_notes: form.review_notes || '',
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to review the loan application.')
      }

      setSuccess(data.message || 'Loan application reviewed successfully.')
      await loadDashboard()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while reviewing the loan application.'
      )
    } finally {
      setIsReviewingLoanId(null)
    }
  }

  return {
    dashboard,
    transactionForm,
    loanReviewForms,
    isLoading,
    isSubmittingTransaction,
    isReviewingLoanId,
    error,
    success,
    storedUser,
    handleLogout,
    handleTransactionFormChange,
    handleTransactionSubmit,
    handleLoanReviewFieldChange,
    handleLoanReviewAction,
  }
}
