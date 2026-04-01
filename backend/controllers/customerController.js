const db = require('../config/db');
const dbPromise = db.promise();

const profileFields = [
    'first_name',
    'last_name',
    'customer_phone',
    'customer_email',
    'customer_address',
    'customer_city',
    'customer_state',
    'pincode',
];

const buildDashboardPayload = async (customerId) => {
    const [[customerRows], [accountRows], [transactionRows], [cardRows], [loanRows], [transferRows]] =
        await Promise.all([
            dbPromise.query(
                `
                    SELECT
                        customer_id,
                        first_name,
                        last_name,
                        date_of_birth,
                        gender,
                        pan_number,
                        aadhaar_number,
                        customer_phone,
                        customer_email,
                        customer_address,
                        customer_city,
                        customer_state,
                        pincode,
                        kyc_status,
                        created_at
                    FROM Customers
                    WHERE customer_id = ?
                    LIMIT 1
                `,
                [customerId]
            ),
            dbPromise.query(
                `
                    SELECT
                        a.account_id,
                        a.account_number,
                        a.account_type,
                        a.account_balance,
                        a.account_currency,
                        a.account_status,
                        a.opened_date,
                        a.annual_interest_rate,
                        b.branch_name,
                        b.branch_city,
                        b.branch_state,
                        b.ifsc_code
                    FROM Accounts a
                    JOIN Branches b ON b.branch_id = a.branch_id
                    WHERE a.customer_id = ?
                    ORDER BY a.opened_date DESC, a.account_id DESC
                `,
                [customerId]
            ),
            dbPromise.query(
                `
                    SELECT
                        t.transaction_id,
                        t.account_id,
                        a.account_number,
                        a.account_type,
                        t.transaction_type,
                        t.transaction_amount,
                        t.balance_after_txn,
                        t.transaction_desc,
                        t.transaction_channel,
                        t.reference_number,
                        t.transaction_status,
                        t.transaction_date
                    FROM Transactions t
                    JOIN Accounts a ON a.account_id = t.account_id
                    WHERE a.customer_id = ?
                    ORDER BY t.transaction_date DESC, t.transaction_id DESC
                    LIMIT 12
                `,
                [customerId]
            ),
            dbPromise.query(
                `
                    SELECT
                        cd.card_id,
                        cd.account_id,
                        a.account_number,
                        cd.card_type,
                        cd.card_network,
                        cd.card_holder_name,
                        cd.issue_date,
                        cd.expiry_date,
                        cd.credit_limit,
                        cd.outstanding_amount,
                        cd.card_status
                    FROM Cards cd
                    JOIN Accounts a ON a.account_id = cd.account_id
                    WHERE a.customer_id = ?
                    ORDER BY cd.expiry_date ASC, cd.card_id DESC
                `,
                [customerId]
            ),
            dbPromise.query(
                `
                    SELECT
                        l.loan_id,
                        l.loan_type,
                        l.principal_amount,
                        l.annual_interest_rate,
                        l.tenure_months,
                        l.emi_amount,
                        l.outstanding_amount,
                        l.disbursement_date,
                        l.maturity_date,
                        l.loan_status,
                        b.branch_name
                    FROM Loans l
                    JOIN Branches b ON b.branch_id = l.branch_id
                    WHERE l.customer_id = ?
                    ORDER BY l.disbursement_date DESC, l.loan_id DESC
                `,
                [customerId]
            ),
            dbPromise.query(
                `
                    SELECT
                        tr.transfer_id,
                        tr.sender_account_id,
                        tr.receiver_account_id,
                        sender.account_number AS sender_account_number,
                        receiver.account_number AS receiver_account_number,
                        tr.transfer_amount,
                        tr.transfer_mode,
                        tr.reference_number,
                        tr.transfer_remarks,
                        tr.transfer_status,
                        tr.initiated_at,
                        tr.completed_at,
                        CASE
                            WHEN sender.customer_id = ? THEN 'Outgoing'
                            ELSE 'Incoming'
                        END AS transfer_direction
                    FROM Transfers tr
                    JOIN Accounts sender ON sender.account_id = tr.sender_account_id
                    JOIN Accounts receiver ON receiver.account_id = tr.receiver_account_id
                    WHERE sender.customer_id = ? OR receiver.customer_id = ?
                    ORDER BY tr.initiated_at DESC, tr.transfer_id DESC
                    LIMIT 10
                `,
                [customerId, customerId, customerId]
            ),
        ]);

    const customer = customerRows[0];

    if (!customer) {
        return null;
    }

    const summary = {
        total_balance: accountRows.reduce(
            (sum, account) => sum + Number(account.account_balance || 0),
            0
        ),
        active_accounts: accountRows.filter((account) => account.account_status === 'Active').length,
        recent_transaction_count: transactionRows.length,
        total_monthly_debits: transactionRows
            .filter((transaction) => transaction.transaction_type === 'Debit')
            .reduce((sum, transaction) => sum + Number(transaction.transaction_amount || 0), 0),
        total_monthly_credits: transactionRows
            .filter((transaction) => transaction.transaction_type === 'Credit')
            .reduce((sum, transaction) => sum + Number(transaction.transaction_amount || 0), 0),
        loan_exposure: loanRows.reduce(
            (sum, loan) => sum + Number(loan.outstanding_amount || 0),
            0
        ),
        active_cards: cardRows.filter((card) => card.card_status === 'Active').length,
    };

    return {
        profile: customer,
        summary,
        accounts: accountRows,
        recent_transactions: transactionRows,
        cards: cardRows,
        loans: loanRows,
        recent_transfers: transferRows,
    };
};

// GET ALL CUSTOMERS
exports.getCustomers = (req, res) => {
    db.query('SELECT * FROM Customers', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
};

// GET CUSTOMER BY ID
exports.getCustomerById = (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM Customers WHERE customer_id = ?',
        [id],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results[0]);
        }
    );
};

exports.getMyDashboard = async (req, res) => {
    try {
        const customerId = req.user.customer_id;
        const dashboard = await buildDashboardPayload(customerId);

        if (!dashboard) {
            return res.status(404).json({ message: 'Customer dashboard not found.' });
        }

        return res.json(dashboard);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to load customer dashboard.' });
    }
};

exports.updateMyProfile = async (req, res) => {
    const customerId = req.user.customer_id;
    const updates = {};

    profileFields.forEach((field) => {
        if (typeof req.body?.[field] === 'string') {
            updates[field] = req.body[field].trim();
        }
    });

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No profile changes were provided.' });
    }

    const requiredFields = [
        'first_name',
        'last_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'customer_city',
        'customer_state',
        'pincode',
    ];

    const missingField = requiredFields.find((field) => !updates[field]);

    if (missingField) {
        return res.status(400).json({ message: `${missingField} cannot be empty.` });
    }

    try {
        await dbPromise.query(
            `
                UPDATE Customers
                SET
                    first_name = ?,
                    last_name = ?,
                    customer_phone = ?,
                    customer_email = ?,
                    customer_address = ?,
                    customer_city = ?,
                    customer_state = ?,
                    pincode = ?
                WHERE customer_id = ?
            `,
            [
                updates.first_name,
                updates.last_name,
                updates.customer_phone,
                updates.customer_email,
                updates.customer_address,
                updates.customer_city,
                updates.customer_state,
                updates.pincode,
                customerId,
            ]
        );

        const dashboard = await buildDashboardPayload(customerId);

        return res.json({
            message: 'Profile updated successfully.',
            profile: dashboard?.profile || null,
        });
    } catch (error) {
        if (error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062)) {
            return res.status(409).json({
                message: 'That email address is already linked to another customer.',
            });
        }

        return res.status(500).json({ message: 'Failed to update customer profile.' });
    }
};
