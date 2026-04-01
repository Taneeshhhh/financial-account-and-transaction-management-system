import { Link } from 'react-router-dom'
import CustomerDashboardLayout from '../components/CustomerDashboardLayout.jsx'
import { formatCurrency, formatDate, useCustomerDashboard } from '../dashboard/customerDashboard.js'

function LoansPage() {
  const {
    dashboard,
    isLoading,
    error,
    success,
    storedUser,
    handleLogout,
  } = useCustomerDashboard()

  const loans = dashboard?.loans || []

  const totalPrincipal = loans.reduce((sum, loan) => sum + Number(loan.principal_amount || 0), 0)
  const totalOutstanding = loans.reduce((sum, loan) => sum + Number(loan.outstanding_amount || 0), 0)
  const activeLoans = loans.filter((loan) => loan.loan_status === 'Active').length

  return (
    <CustomerDashboardLayout
      dashboard={dashboard}
      storedUser={storedUser}
      error={error}
      success={success}
      isLoading={isLoading}
      onLogout={handleLogout}
      title="Loans Overview"
      description="A dedicated loan workspace built from the `Loans` table, including loan type, principal amount, annual interest rate, tenure, EMI amount, outstanding amount, branch, disbursement date, maturity date, and loan status."
      actions={
        <>
          <Link className="button-link button-link--primary" to="/dashboard/accounts">
            Open Accounts
          </Link>
          <Link className="button-link button-link--secondary" to="/dashboard/profile">
            View Profile
          </Link>
        </>
      }
    >
      <div className="dashboard-stats">
        <article className="dashboard-card">
          <span>Total Loans</span>
          <strong>{loans.length}</strong>
          <p>All customer loans listed from the `Loans` table.</p>
        </article>
        <article className="dashboard-card">
          <span>Principal Amount</span>
          <strong>{formatCurrency(totalPrincipal)}</strong>
          <p>Combined sanctioned amount across all listed loans.</p>
        </article>
        <article className="dashboard-card">
          <span>Outstanding Amount</span>
          <strong>{formatCurrency(totalOutstanding)}</strong>
          <p>{activeLoans} loan{activeLoans === 1 ? '' : 's'} currently marked active.</p>
        </article>
      </div>

      <article className="dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <p className="hero-card__eyebrow">Loans</p>
            <h3>Sanctioned loans and repayment position</h3>
          </div>
        </div>
        <div className="dashboard-table dashboard-table--wide">
          <div className="dashboard-table__row dashboard-table__row--head dashboard-table__row--loans">
            <span>Loan Type</span>
            <span>Branch</span>
            <span>Principal</span>
            <span>Outstanding</span>
            <span>EMI</span>
            <span>Rate</span>
            <span>Tenure</span>
            <span>Status</span>
            <span>Maturity</span>
          </div>
          {loans.length ? (
            loans.map((loan) => (
              <div key={loan.loan_id} className="dashboard-table__row dashboard-table__row--loans">
                <span>
                  {loan.loan_type}
                  <small className="dashboard-inline-note">
                    Disbursed {formatDate(loan.disbursement_date)}
                  </small>
                </span>
                <span>{loan.branch_name}</span>
                <span>{formatCurrency(loan.principal_amount)}</span>
                <span>{formatCurrency(loan.outstanding_amount)}</span>
                <span>{formatCurrency(loan.emi_amount)}</span>
                <span>{loan.annual_interest_rate}%</span>
                <span>{loan.tenure_months} mo</span>
                <span className={`dashboard-badge dashboard-badge--${String(loan.loan_status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                  {loan.loan_status}
                </span>
                <span>{formatDate(loan.maturity_date)}</span>
              </div>
            ))
          ) : (
            <p className="dashboard-empty">No loans are currently linked to this customer.</p>
          )}
        </div>
      </article>
    </CustomerDashboardLayout>
  )
}

export default LoansPage
