import { Link } from 'react-router-dom'
import CustomerDashboardLayout from '../components/CustomerDashboardLayout.jsx'
import { formatCurrency, formatDate, useCustomerDashboard } from '../dashboard/customerDashboard.js'

function TransfersPage() {
  const {
    dashboard,
    isLoading,
    error,
    success,
    storedUser,
    handleLogout,
  } = useCustomerDashboard()

  const transfers = dashboard?.recent_transfers || []
  const outgoingTransfers = transfers.filter((transfer) => transfer.transfer_direction === 'Outgoing')
  const incomingTransfers = transfers.filter((transfer) => transfer.transfer_direction === 'Incoming')
  const totalOutgoing = outgoingTransfers.reduce(
    (sum, transfer) => sum + Number(transfer.transfer_amount || 0),
    0
  )
  const totalIncoming = incomingTransfers.reduce(
    (sum, transfer) => sum + Number(transfer.transfer_amount || 0),
    0
  )

  return (
    <CustomerDashboardLayout
      dashboard={dashboard}
      storedUser={storedUser}
      error={error}
      success={success}
      isLoading={isLoading}
      onLogout={handleLogout}
      title="Transfers Activity"
      description="A transfer-focused page using the `Transfers` table fields: sender account, receiver account, amount, transfer mode, reference number, remarks, status, initiation time, completion time, and transfer direction."
      actions={
        <>
          <Link className="button-link button-link--primary" to="/dashboard/transactions">
            Open Transactions
          </Link>
          <Link className="button-link button-link--secondary" to="/dashboard/cards">
            View Cards
          </Link>
        </>
      }
    >
      <div className="dashboard-stats">
        <article className="dashboard-card">
          <span>Recent Transfers</span>
          <strong>{transfers.length}</strong>
          <p>Transfers where the customer is sender or receiver.</p>
        </article>
        <article className="dashboard-card">
          <span>Total Outgoing</span>
          <strong>{formatCurrency(totalOutgoing)}</strong>
          <p>Based on rows marked as outgoing in the dashboard payload.</p>
        </article>
        <article className="dashboard-card">
          <span>Total Incoming</span>
          <strong>{formatCurrency(totalIncoming)}</strong>
          <p>Based on rows marked as incoming in the dashboard payload.</p>
        </article>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Transfers</p>
                <h3>Detailed transfer feed</h3>
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
                    <div className="dashboard-product-card__grid">
                      <p>Sender account: {transfer.sender_account_number}</p>
                      <p>Receiver account: {transfer.receiver_account_number}</p>
                      <p>Transfer mode: {transfer.transfer_mode}</p>
                      <p>Status: {transfer.transfer_status}</p>
                      <p>Reference number: {transfer.reference_number}</p>
                      <p>Initiated at: {formatDate(transfer.initiated_at, { timeStyle: 'short' })}</p>
                      <p>Completed at: {formatDate(transfer.completed_at, { timeStyle: 'short' })}</p>
                      <p>Remarks: {transfer.transfer_remarks || 'No remarks provided'}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="dashboard-empty">No recent transfers were found.</p>
              )}
            </div>
          </article>
        </div>

        <div className="dashboard-column">
          <article className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <p className="hero-card__eyebrow">Direction Mix</p>
                <h3>Incoming vs outgoing</h3>
              </div>
            </div>
            <div className="dashboard-stack">
              <article className="dashboard-mini-card">
                <strong>Outgoing transfers</strong>
                <p>{outgoingTransfers.length} transfer{outgoingTransfers.length === 1 ? '' : 's'} initiated from customer-linked accounts.</p>
              </article>
              <article className="dashboard-mini-card">
                <strong>Incoming transfers</strong>
                <p>{incomingTransfers.length} transfer{incomingTransfers.length === 1 ? '' : 's'} received into customer-linked accounts.</p>
              </article>
              <article className="dashboard-mini-card">
                <strong>Status coverage</strong>
                <p>{new Set(transfers.map((transfer) => transfer.transfer_status)).size} distinct transfer status values are present in the recent feed.</p>
              </article>
            </div>
          </article>
        </div>
      </div>
    </CustomerDashboardLayout>
  )
}

export default TransfersPage
