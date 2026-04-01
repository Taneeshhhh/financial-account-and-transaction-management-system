import { Link } from 'react-router-dom'
import CustomerDashboardLayout from '../components/CustomerDashboardLayout.jsx'
import { formatCurrency, formatDate, useCustomerDashboard } from '../dashboard/customerDashboard.js'

function AccountsPage() {
  const {
    dashboard,
    isLoading,
    error,
    success,
    storedUser,
    handleLogout,
  } = useCustomerDashboard()

  const accounts = dashboard?.accounts || []
  const cards = dashboard?.cards || []
  const loans = dashboard?.loans || []

  const title = dashboard?.profile
    ? `${dashboard.profile.first_name}'s Accounts`
    : 'Your accounts'

  const description =
    'Detailed account portfolio built from the Accounts and Branches tables, with linked card and loan context pulled from your customer dashboard.'

  return (
    <CustomerDashboardLayout
      dashboard={dashboard}
      storedUser={storedUser}
      error={error}
      success={success}
      isLoading={isLoading}
      onLogout={handleLogout}
      title={title}
      description={description}
      actions={
        <>
          <Link className="button-link button-link--primary" to="/dashboard/transactions">
            Review Transactions
          </Link>
          <Link className="button-link button-link--secondary" to="/dashboard/profile">
            Open Profile
          </Link>
        </>
      }
    >
      <div className="dashboard-stats">
        <article className="dashboard-card">
          <span>Linked Accounts</span>
          <strong>{accounts.length}</strong>
          <p>Total customer accounts mapped from the `Accounts` table.</p>
        </article>
        <article className="dashboard-card">
          <span>Total Balance</span>
          <strong>{formatCurrency(dashboard?.summary?.total_balance)}</strong>
          <p>Combined `account_balance` across all linked accounts.</p>
        </article>
        <article className="dashboard-card">
          <span>Active Accounts</span>
          <strong>{dashboard?.summary?.active_accounts || 0}</strong>
          <p>Accounts currently marked `Active` in the schema.</p>
        </article>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Accounts</p>
                <h3>Account registry and branch assignment</h3>
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
                      <p>Balance: {formatCurrency(account.account_balance, account.account_currency || 'INR')}</p>
                      <p>Currency: {account.account_currency}</p>
                      <p>Interest rate: {account.annual_interest_rate ? `${account.annual_interest_rate}%` : 'Not applicable'}</p>
                      <p>Opened date: {formatDate(account.opened_date)}</p>
                      <p>Branch: {account.branch_name}</p>
                      <p>IFSC code: {account.ifsc_code}</p>
                      <p>City: {account.branch_city}</p>
                      <p>State: {account.branch_state}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No linked accounts were found for this customer.</p>
              )}
            </div>
          </article>
        </div>

        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Cards</p>
                <h3>Cards linked to each account</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              {cards.length ? (
                cards.map((card) => (
                  <article key={card.card_id} className="dashboard-mini-card">
                    <strong>{card.card_network} {card.card_type}</strong>
                    <span>{card.account_number}</span>
                    <p>Holder name: {card.card_holder_name}</p>
                    <p>Issued: {formatDate(card.issue_date)}</p>
                    <p>Expires: {formatDate(card.expiry_date)}</p>
                    <p>Status: {card.card_status}</p>
                    <p>
                      Outstanding: {formatCurrency(card.outstanding_amount)}
                      {card.credit_limit ? ` / Limit ${formatCurrency(card.credit_limit)}` : ''}
                    </p>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No cards are linked to these accounts yet.</p>
              )}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Loans</p>
                <h3>Borrowing exposure connected to this customer</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              {loans.length ? (
                loans.map((loan) => (
                  <article key={loan.loan_id} className="dashboard-mini-card">
                    <strong>{loan.loan_type} loan</strong>
                    <span>{loan.branch_name}</span>
                    <p>Principal amount: {formatCurrency(loan.principal_amount)}</p>
                    <p>Outstanding amount: {formatCurrency(loan.outstanding_amount)}</p>
                    <p>Tenure: {loan.tenure_months} months</p>
                    <p>EMI amount: {formatCurrency(loan.emi_amount)}</p>
                    <p>Interest rate: {loan.annual_interest_rate}%</p>
                    <p>Status: {loan.loan_status}</p>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No loans are currently linked to this customer.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </CustomerDashboardLayout>
  )
}

export default AccountsPage
