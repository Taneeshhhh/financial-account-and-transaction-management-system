import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const sidebarItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'cards', label: 'Cards' },
  { id: 'loans', label: 'Loans' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'profile', label: 'Profile' },
]

const apiBaseUrl = 'http://localhost:5000/api'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const formatDate = (value, options = {}) => {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(value))
}

const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.trim().toUpperCase() || 'CU'

function DashboardPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
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

  const profile = dashboard?.profile
  const summary = dashboard?.summary
  const accounts = dashboard?.accounts || []
  const transactions = dashboard?.recent_transactions || []
  const cards = dashboard?.cards || []
  const loans = dashboard?.loans || []
  const transfers = dashboard?.recent_transfers || []

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <p className="hero-card__eyebrow">Customer Banking</p>
          <h2>BlueCrest Bank</h2>
          <span className="dashboard-sidebar__subtext">
            Unified view of your accounts, cards, loans, and profile.
          </span>
        </div>

        <nav className="dashboard-sidebar__nav" aria-label="Dashboard navigation">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? 'dashboard-nav__link is-active' : 'dashboard-nav__link'}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          <Link className="button-link button-link--secondary dashboard-side-button" to="/signup">
            Open another profile
          </Link>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="hero-card__eyebrow">Customer Dashboard</p>
            <h1 className="dashboard-title">
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Your banking workspace'}
            </h1>
            <p className="dashboard-topbar__text">
              View linked accounts, recent transactions, transfers, cards, loans, and profile updates in one place.
            </p>
          </div>

          <div className="dashboard-user">
            <div className="dashboard-user__meta">
              <strong>{storedUser.customer_email || profile?.customer_email || 'Customer account'}</strong>
              <span>{profile?.kyc_status ? `KYC ${profile.kyc_status}` : 'Customer Account'}</span>
            </div>
            <div className="dashboard-user__avatar">
              {getInitials(profile?.first_name, profile?.last_name)}
            </div>
          </div>
        </header>

        {error ? <p className="form-error dashboard-notice">{error}</p> : null}
        {success ? <p className="form-success dashboard-notice">{success}</p> : null}

        {isLoading ? (
          <section className="dashboard-content">
            <article className="dashboard-hero">
              <div>
                <p className="hero-card__eyebrow">Loading</p>
                <h2>Preparing your banking snapshot.</h2>
                <p>Fetching accounts, transactions, cards, loans, and profile details.</p>
              </div>
            </article>
          </section>
        ) : (
          <section className="dashboard-content">
            <article className="dashboard-hero">
              <div>
                <p className="hero-card__eyebrow">Financial Snapshot</p>
                <h2>
                  {summary
                    ? `${formatCurrency(summary.total_balance)} available across your linked accounts`
                    : 'Your customer dashboard is ready'}
                </h2>
                <p>
                  Based on the `Customers`, `Accounts`, `Transactions`, `Cards`, `Loans`, and `Transfers`
                  tables from your schema, this dashboard brings together the core customer banking journey.
                </p>
              </div>
              <div className="dashboard-hero__actions">
                <button type="button" className="button-link button-link--primary" onClick={() => setActiveSection('profile')}>
                  Update Profile
                </button>
                <button type="button" className="button-link button-link--secondary" onClick={() => setActiveSection('transactions')}>
                  View Activity
                </button>
              </div>
            </article>

            <div className="dashboard-stats">
              <article className="dashboard-card">
                <span>Total Balance</span>
                <strong>{formatCurrency(summary?.total_balance)}</strong>
                <p>{summary?.active_accounts || 0} active accounts currently available.</p>
              </article>
              <article className="dashboard-card">
                <span>Recent Credits</span>
                <strong>{formatCurrency(summary?.total_monthly_credits)}</strong>
                <p>Latest credits across your most recent transactions.</p>
              </article>
              <article className="dashboard-card">
                <span>Recent Debits</span>
                <strong>{formatCurrency(summary?.total_monthly_debits)}</strong>
                <p>Spending and outgoing movement from the latest activity.</p>
              </article>
              <article className="dashboard-card">
                <span>Cards</span>
                <strong>{summary?.active_cards || 0}</strong>
                <p>Active debit or credit cards linked to your accounts.</p>
              </article>
              <article className="dashboard-card">
                <span>Loan Exposure</span>
                <strong>{formatCurrency(summary?.loan_exposure)}</strong>
                <p>Outstanding amount across active or historical loans.</p>
              </article>
              <article className="dashboard-card">
                <span>Transactions</span>
                <strong>{summary?.recent_transaction_count || 0}</strong>
                <p>Most recent entries loaded into your activity feed.</p>
              </article>
            </div>

            <div className="dashboard-layout">
              <div className="dashboard-column">
                {(activeSection === 'overview' || activeSection === 'accounts') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Accounts</p>
                        <h3>Linked accounts and branch details</h3>
                      </div>
                    </div>
                    <div className="dashboard-stack">
                      {accounts.length ? (
                        accounts.map((account) => (
                          <article key={account.account_id} className="dashboard-product-card">
                            <div className="dashboard-product-card__head">
                              <div>
                                <strong>{account.account_type}</strong>
                                <span>{account.account_number}</span>
                              </div>
                              <span className={`dashboard-badge dashboard-badge--${String(account.account_status || '').toLowerCase()}`}>
                                {account.account_status}
                              </span>
                            </div>
                            <div className="dashboard-product-card__grid">
                              <p>Balance: {formatCurrency(account.account_balance)}</p>
                              <p>Interest: {account.annual_interest_rate ? `${account.annual_interest_rate}%` : 'Not applicable'}</p>
                              <p>Branch: {account.branch_name}</p>
                              <p>IFSC: {account.ifsc_code}</p>
                              <p>Location: {account.branch_city}, {account.branch_state}</p>
                              <p>Opened: {formatDate(account.opened_date)}</p>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="dashboard-empty">No linked accounts were found for this customer.</p>
                      )}
                    </div>
                  </article>
                )}

                {(activeSection === 'overview' || activeSection === 'transactions') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Transactions</p>
                        <h3>Recent transaction activity</h3>
                      </div>
                    </div>
                    <div className="dashboard-table dashboard-table--wide">
                      <div className="dashboard-table__row dashboard-table__row--head dashboard-table__row--transactions">
                        <span>Reference</span>
                        <span>Account</span>
                        <span>Type</span>
                        <span>Channel</span>
                        <span>Amount</span>
                        <span>Date</span>
                      </div>
                      {transactions.length ? (
                        transactions.map((transaction) => (
                          <div key={transaction.transaction_id} className="dashboard-table__row dashboard-table__row--transactions">
                            <span>{transaction.reference_number}</span>
                            <span>{transaction.account_number}</span>
                            <span className={transaction.transaction_type === 'Credit' ? 'text-credit' : 'text-debit'}>
                              {transaction.transaction_type}
                            </span>
                            <span>{transaction.transaction_channel}</span>
                            <span>{formatCurrency(transaction.transaction_amount)}</span>
                            <span>{formatDate(transaction.transaction_date, { timeStyle: 'short' })}</span>
                          </div>
                        ))
                      ) : (
                        <p className="dashboard-empty">No recent transactions were found.</p>
                      )}
                    </div>
                  </article>
                )}

                {(activeSection === 'overview' || activeSection === 'transfers') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Transfers</p>
                        <h3>Incoming and outgoing transfers</h3>
                      </div>
                    </div>
                    <div className="dashboard-stack">
                      {transfers.length ? (
                        transfers.map((transfer) => (
                          <article key={transfer.transfer_id} className="dashboard-transfer-card">
                            <div className="dashboard-transfer-card__top">
                              <strong>{transfer.transfer_direction}</strong>
                              <span>{formatCurrency(transfer.transfer_amount)}</span>
                            </div>
                            <p>
                              {transfer.sender_account_number} to {transfer.receiver_account_number}
                            </p>
                            <p>
                              {transfer.transfer_mode} · {transfer.reference_number} · {transfer.transfer_status}
                            </p>
                            <p>{transfer.transfer_remarks || 'No remarks provided.'}</p>
                            <p>Initiated {formatDate(transfer.initiated_at, { timeStyle: 'short' })}</p>
                          </article>
                        ))
                      ) : (
                        <p className="dashboard-empty">No recent transfers were found.</p>
                      )}
                    </div>
                  </article>
                )}
              </div>

              <div className="dashboard-column">
                {(activeSection === 'overview' || activeSection === 'cards') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Cards</p>
                        <h3>Card portfolio</h3>
                      </div>
                    </div>
                    <div className="dashboard-stack">
                      {cards.length ? (
                        cards.map((card) => (
                          <article key={card.card_id} className="dashboard-mini-card">
                            <strong>{card.card_network} {card.card_type}</strong>
                            <span>{card.account_number}</span>
                            <p>Holder: {card.card_holder_name}</p>
                            <p>Status: {card.card_status}</p>
                            <p>Expires: {formatDate(card.expiry_date)}</p>
                            <p>
                              Outstanding: {formatCurrency(card.outstanding_amount)}
                              {card.credit_limit ? ` / Limit ${formatCurrency(card.credit_limit)}` : ''}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className="dashboard-empty">No cards are linked to this customer yet.</p>
                      )}
                    </div>
                  </article>
                )}

                {(activeSection === 'overview' || activeSection === 'loans') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Loans</p>
                        <h3>Loan summary</h3>
                      </div>
                    </div>
                    <div className="dashboard-stack">
                      {loans.length ? (
                        loans.map((loan) => (
                          <article key={loan.loan_id} className="dashboard-mini-card">
                            <strong>{loan.loan_type} loan</strong>
                            <span>{loan.branch_name}</span>
                            <p>Principal: {formatCurrency(loan.principal_amount)}</p>
                            <p>Outstanding: {formatCurrency(loan.outstanding_amount)}</p>
                            <p>EMI: {formatCurrency(loan.emi_amount)}</p>
                            <p>Interest: {loan.annual_interest_rate}%</p>
                            <p>Status: {loan.loan_status}</p>
                          </article>
                        ))
                      ) : (
                        <p className="dashboard-empty">No loans are currently linked to this customer.</p>
                      )}
                    </div>
                  </article>
                )}

                {(activeSection === 'overview' || activeSection === 'profile') && (
                  <article className="dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <p className="hero-card__eyebrow">Profile</p>
                        <h3>Customer details and profile updates</h3>
                      </div>
                    </div>

                    {profile ? (
                      <div className="dashboard-profile">
                        <div className="dashboard-profile__summary">
                          <p>KYC Status: <strong>{profile.kyc_status}</strong></p>
                          <p>Date of birth: <strong>{formatDate(profile.date_of_birth)}</strong></p>
                          <p>Gender: <strong>{profile.gender}</strong></p>
                          <p>PAN: <strong>{profile.pan_number}</strong></p>
                          <p>Aadhaar: <strong>{profile.aadhaar_number}</strong></p>
                          <p>Customer since: <strong>{formatDate(profile.created_at, { timeStyle: 'short' })}</strong></p>
                        </div>

                        <form className="auth-form dashboard-profile__form" onSubmit={handleProfileSubmit}>
                          <div className="form-grid">
                            <label className="field-group">
                              <span>First name</span>
                              <input name="first_name" value={profileForm.first_name} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>Last name</span>
                              <input name="last_name" value={profileForm.last_name} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>Phone</span>
                              <input name="customer_phone" value={profileForm.customer_phone} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>Email</span>
                              <input type="email" name="customer_email" value={profileForm.customer_email} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group field-group--full">
                              <span>Address</span>
                              <input name="customer_address" value={profileForm.customer_address} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>City</span>
                              <input name="customer_city" value={profileForm.customer_city} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>State</span>
                              <input name="customer_state" value={profileForm.customer_state} onChange={handleProfileChange} required />
                            </label>
                            <label className="field-group">
                              <span>Pincode</span>
                              <input name="pincode" value={profileForm.pincode} onChange={handleProfileChange} required />
                            </label>
                          </div>

                          <button className="button-link button-link--primary auth-submit" type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving changes...' : 'Save profile changes'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <p className="dashboard-empty">Customer profile information is not available.</p>
                    )}
                  </article>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
