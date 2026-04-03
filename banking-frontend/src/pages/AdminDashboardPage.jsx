import AdminDashboardLayout from '../components/AdminDashboardLayout.jsx'
import { adminTransactionTypeOptions, useAdminDashboard } from '../dashboard/adminDashboard.js'
import { formatCurrency, formatDate } from '../dashboard/customerDashboard.js'

function AdminDashboardPage() {
  const {
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
  } = useAdminDashboard()

  const profile = dashboard?.profile
  const summary = dashboard?.summary
  const accounts = dashboard?.accounts || []
  const customers = dashboard?.customers || []
  const recentAccounts = dashboard?.recent_accounts || []
  const recentTransactions = dashboard?.recent_transactions || []
  const activeLoans = dashboard?.active_loans || []
  const pendingLoanApplications = dashboard?.pending_loan_applications || []
  const selectedAccount = accounts.find(
    (account) => String(account.account_id) === String(transactionForm.account_id)
  )

  return (
    <AdminDashboardLayout
      dashboard={dashboard}
      storedUser={storedUser}
      error={error}
      success={success}
      isLoading={isLoading}
      onLogout={handleLogout}
      title={profile ? `${profile.branch_name} Branch` : 'Branch operations'}
      description="Cash deposits and withdrawals are recorded as branch-counter transactions, and pending loan requests can be reviewed with full customer, account, and balance-history context."
    >
      <div className="dashboard-stats">
        <article className="dashboard-card">
          <span>Total Accounts In Branch</span>
          <strong>{summary?.total_accounts || 0}</strong>
          <p>Accounts currently mapped to this branch.</p>
        </article>
        <article className="dashboard-card">
          <span>Total Deposits</span>
          <strong>{formatCurrency(summary?.total_deposits)}</strong>
          <p>Current sum of balances across branch accounts.</p>
        </article>
        <article className="dashboard-card">
          <span>Transactions Today</span>
          <strong>{summary?.total_transactions_today || 0}</strong>
          <p>Branch transaction count for the current day.</p>
        </article>
        <article className="dashboard-card">
          <span>Active Loans</span>
          <strong>{summary?.active_loans || 0}</strong>
          <p>Open loan accounts handled by this branch.</p>
        </article>
        <article className="dashboard-card">
          <span>Pending Loan Requests</span>
          <strong>{summary?.pending_loan_applications || 0}</strong>
          <p>Applications waiting for accountant review.</p>
        </article>
        <article className="dashboard-card">
          <span>Branch IFSC</span>
          <strong>{profile?.ifsc_code || 'N/A'}</strong>
          <p>{profile?.branch_city}, {profile?.branch_state}</p>
        </article>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Loan Review</p>
                <h3>Pending loan applications for this branch</h3>
              </div>
            </div>

            <div className="dashboard-stack">
              {pendingLoanApplications.length ? (
                pendingLoanApplications.map((application) => {
                  const reviewForm =
                    loanReviewForms[String(application.loan_application_id)] || {}
                  const existingActiveLoans = application.customer_loans.filter(
                    (loan) => loan.loan_status === 'Active'
                  )

                  return (
                    <article key={application.loan_application_id} className="dashboard-product-card">
                      <div className="dashboard-product-card__head">
                        <div>
                          <strong>
                            {application.first_name} {application.last_name}
                          </strong>
                          <span>
                            {application.loan_type} loan request · Submitted{' '}
                            {formatDate(application.created_at, { timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className="dashboard-badge dashboard-badge--pending">
                          Pending
                        </span>
                      </div>

                      <div className="dashboard-product-card__grid">
                        <p>Requested amount: {formatCurrency(application.requested_amount)}</p>
                        <p>Suggested rate: {application.annual_interest_rate}%</p>
                        <p>Estimated EMI: {formatCurrency(application.estimated_emi)}</p>
                        <p>Tenure: {application.tenure_months} months</p>
                        <p>Linked account: {application.linked_account_number}</p>
                        <p>Linked balance: {formatCurrency(application.linked_account_balance)}</p>
                        <p>Linked status: {application.linked_account_status}</p>
                        <p>KYC status: {application.kyc_status}</p>
                        <p>Email: {application.customer_email}</p>
                        <p>Phone: {application.customer_phone}</p>
                        <p>City: {application.customer_city}</p>
                        <p>State: {application.customer_state}</p>
                      </div>

                      <p>Purpose: {application.purpose}</p>

                      <div className="dashboard-profile__summary dashboard-profile__summary--cards">
                        <div className="dashboard-mini-card">
                          <strong>Customer accounts</strong>
                          {application.customer_accounts.length ? (
                            application.customer_accounts.map((account) => (
                              <p key={account.account_id}>
                                {account.account_number} · {account.account_type} · {formatCurrency(account.account_balance)} · {account.account_status}
                              </p>
                            ))
                          ) : (
                            <p>No customer accounts found.</p>
                          )}
                        </div>

                        <div className="dashboard-mini-card">
                          <strong>Existing loans</strong>
                          {existingActiveLoans.length ? (
                            existingActiveLoans.map((loan) => (
                              <p key={loan.loan_id}>
                                {loan.loan_type} · Outstanding {formatCurrency(loan.outstanding_amount)} · EMI {formatCurrency(loan.emi_amount)}
                              </p>
                            ))
                          ) : (
                            <p>No active loans linked to this customer.</p>
                          )}
                        </div>
                      </div>

                      <div className="dashboard-mini-card">
                        <strong>Account balance history</strong>
                        {application.account_balance_history.length ? (
                          application.account_balance_history.map((entry) => (
                            <p key={entry.transaction_id}>
                              {formatDate(entry.transaction_date, { timeStyle: 'short' })} ·{' '}
                              {entry.account_number} · {entry.transaction_type} {formatCurrency(entry.transaction_amount)} · Balance {formatCurrency(entry.balance_after_txn)}
                            </p>
                          ))
                        ) : (
                          <p>No balance history is available for this customer yet.</p>
                        )}
                      </div>

                      <div className="form-grid dashboard-form-section">
                        <label className="field-group">
                          <span>Approved Amount</span>
                          <input
                            name="approved_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={reviewForm.approved_amount || ''}
                            onChange={(event) =>
                              handleLoanReviewFieldChange(application.loan_application_id, event)
                            }
                            disabled={isReviewingLoanId === application.loan_application_id}
                          />
                        </label>

                        <label className="field-group">
                          <span>Annual Interest Rate</span>
                          <input
                            name="annual_interest_rate"
                            type="number"
                            min="0"
                            step="0.01"
                            value={reviewForm.annual_interest_rate || ''}
                            onChange={(event) =>
                              handleLoanReviewFieldChange(application.loan_application_id, event)
                            }
                            disabled={isReviewingLoanId === application.loan_application_id}
                          />
                        </label>

                        <label className="field-group field-group--full">
                          <span>Review Notes</span>
                          <textarea
                            name="review_notes"
                            value={reviewForm.review_notes || ''}
                            onChange={(event) =>
                              handleLoanReviewFieldChange(application.loan_application_id, event)
                            }
                            disabled={isReviewingLoanId === application.loan_application_id}
                            rows="3"
                            placeholder="Record the reason for approval or rejection."
                          />
                        </label>
                      </div>

                      <div className="dashboard-button-row">
                        <button
                          type="button"
                          className="button-link button-link--primary"
                          disabled={isReviewingLoanId === application.loan_application_id}
                          onClick={() =>
                            handleLoanReviewAction(application.loan_application_id, 'approve')
                          }
                        >
                          {isReviewingLoanId === application.loan_application_id
                            ? 'Reviewing...'
                            : 'Approve And Credit Account'}
                        </button>
                        <button
                          type="button"
                          className="button-link button-link--secondary"
                          disabled={isReviewingLoanId === application.loan_application_id}
                          onClick={() =>
                            handleLoanReviewAction(application.loan_application_id, 'reject')
                          }
                        >
                          Reject Application
                        </button>
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="dashboard-empty">No pending loan applications are waiting in this branch.</p>
              )}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Counter Service</p>
                <h3>Deposit or withdraw at the branch counter</h3>
              </div>
            </div>

            <form className="auth-form dashboard-profile__form" onSubmit={handleTransactionSubmit}>
              <div className="form-grid">
                <label className="field-group">
                  <span>Account</span>
                  <select
                    name="account_id"
                    value={transactionForm.account_id}
                    onChange={handleTransactionFormChange}
                    disabled={isSubmittingTransaction || accounts.length === 0}
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.account_number} · {account.customer_name} · {account.account_status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group">
                  <span>Transaction Type</span>
                  <select
                    name="transaction_type"
                    value={transactionForm.transaction_type}
                    onChange={handleTransactionFormChange}
                    disabled={isSubmittingTransaction}
                  >
                    {adminTransactionTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type === 'Credit' ? 'Deposit money' : 'Withdraw money'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group">
                  <span>Amount</span>
                  <input
                    name="transaction_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transactionForm.transaction_amount}
                    onChange={handleTransactionFormChange}
                    disabled={isSubmittingTransaction}
                    placeholder="0.00"
                  />
                </label>

                <label className="field-group">
                  <span>Remark</span>
                  <input
                    name="transaction_desc"
                    type="text"
                    value={transactionForm.transaction_desc}
                    onChange={handleTransactionFormChange}
                    disabled={isSubmittingTransaction}
                    placeholder="Example: Cash deposit received at teller desk"
                  />
                </label>
              </div>

              <div className="dashboard-profile__summary dashboard-profile__summary--cards">
                <div className="dashboard-mini-card">
                  <strong>Selected account</strong>
                  <p>{selectedAccount?.account_number || 'Choose an account'}</p>
                  <p>{selectedAccount?.customer_name || 'Customer will appear here'}</p>
                </div>
                <div className="dashboard-mini-card">
                  <strong>Available balance</strong>
                  <p>
                    {selectedAccount
                      ? formatCurrency(
                          selectedAccount.account_balance,
                          selectedAccount.account_currency || 'INR'
                        )
                      : 'Select an account first'}
                  </p>
                  <p>Status: {selectedAccount?.account_status || 'Unknown'}</p>
                </div>
              </div>

              <button
                type="submit"
                className="button-link button-link--primary auth-submit"
                disabled={isSubmittingTransaction || !transactionForm.account_id}
              >
                {isSubmittingTransaction
                  ? 'Recording Transaction...'
                  : transactionForm.transaction_type === 'Credit'
                    ? 'Record Cash Deposit'
                    : 'Record Cash Withdrawal'}
              </button>
            </form>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Recent Transactions</p>
                <h3>Latest activity in this branch</h3>
              </div>
            </div>
            <div className="dashboard-table dashboard-table--wide">
              <div className="dashboard-table__row dashboard-table__row--head dashboard-table__row--transactions-extended">
                <span>Reference</span>
                <span>Account</span>
                <span>Type</span>
                <span>Channel</span>
                <span>Status</span>
                <span>Amount</span>
                <span>Balance After</span>
                <span>Date</span>
              </div>
              {recentTransactions.length ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.transaction_id} className="dashboard-table__row dashboard-table__row--transactions-extended">
                    <span>{transaction.reference_number}</span>
                    <span>
                      {transaction.account_number}
                      <small className="dashboard-inline-note">{transaction.customer_name}</small>
                    </span>
                    <span className={transaction.transaction_type === 'Credit' ? 'text-credit' : 'text-debit'}>
                      {transaction.transaction_type}
                    </span>
                    <span>{transaction.transaction_channel}</span>
                    <span>{transaction.transaction_status}</span>
                    <span>{formatCurrency(transaction.transaction_amount)}</span>
                    <span>{formatCurrency(transaction.balance_after_txn)}</span>
                    <span>{formatDate(transaction.transaction_date, { timeStyle: 'short' })}</span>
                  </div>
                ))
              ) : (
                <p className="dashboard-empty">No branch transactions were found yet.</p>
              )}
            </div>
          </article>
        </div>

        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Recently Created Accounts</p>
                <h3>Newest accounts opened in this branch</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              {recentAccounts.length ? (
                recentAccounts.map((account) => (
                  <article key={account.account_id} className="dashboard-product-card">
                    <div className="dashboard-product-card__head">
                      <div>
                        <strong>{account.account_number}</strong>
                        <span>{account.customer_name}</span>
                      </div>
                      <span className={`dashboard-badge dashboard-badge--${String(account.account_status || '').toLowerCase()}`}>
                        {account.account_status}
                      </span>
                    </div>
                    <div className="dashboard-product-card__grid">
                      <p>Type: {account.account_type}</p>
                      <p>Balance: {formatCurrency(account.account_balance)}</p>
                      <p>Opened: {formatDate(account.opened_date)}</p>
                      <p>Created: {formatDate(account.created_at, { timeStyle: 'short' })}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No recently created accounts are available.</p>
              )}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Customers</p>
                <h3>Customers linked to branch accounts</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              {customers.length ? (
                customers.map((customer) => (
                  <article key={customer.customer_id} className="dashboard-mini-card">
                    <strong>
                      {customer.first_name} {customer.last_name}
                    </strong>
                    <span>{customer.customer_email}</span>
                    <p>Phone: {customer.customer_phone}</p>
                    <p>KYC: {customer.kyc_status}</p>
                    <p>Joined: {formatDate(customer.created_at, { timeStyle: 'short' })}</p>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No linked customers were found.</p>
              )}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Active Loans</p>
                <h3>Current branch lending exposure</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              {activeLoans.length ? (
                activeLoans.map((loan) => (
                  <article key={loan.loan_id} className="dashboard-mini-card">
                    <strong>{loan.loan_type} loan</strong>
                    <span>{loan.customer_name}</span>
                    <p>Principal: {formatCurrency(loan.principal_amount)}</p>
                    <p>Outstanding: {formatCurrency(loan.outstanding_amount)}</p>
                    <p>EMI: {formatCurrency(loan.emi_amount)}</p>
                    <p>Disbursed: {formatDate(loan.disbursement_date)}</p>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">There are no active loans in this branch right now.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminDashboardPage
