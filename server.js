import express from 'express';
import path from 'path';
import pg from 'pg';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use(express.static('public'));

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize database schema
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create enums
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE account_type AS ENUM ('main', 'savings', 'other');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE transaction_type AS ENUM ('expense', 'income');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE category AS ENUM ('food', 'transport', 'entertainment', 'study', 'mess', 'other');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE debt_type AS ENUM ('owe', 'owed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE reminder_status AS ENUM ('pending', 'paid', 'snoozed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                type account_type NOT NULL DEFAULT 'main',
                balance DECIMAL(10,2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                account_id VARCHAR NOT NULL REFERENCES accounts(id),
                type transaction_type NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                description TEXT NOT NULL,
                category category NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS debts (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                friend_name TEXT NOT NULL,
                type debt_type NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                description TEXT NOT NULL,
                settled BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS reminders (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                description TEXT,
                amount DECIMAL(10,2) NOT NULL,
                due_date TIMESTAMP NOT NULL,
                status reminder_status NOT NULL DEFAULT 'pending',
                recurring BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                is_user BOOLEAN NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // Create default accounts if they don't exist
        const accountsResult = await client.query('SELECT COUNT(*) FROM accounts');
        if (parseInt(accountsResult.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO accounts (name, type, balance) VALUES 
                ('Main Account', 'main', 2450.00),
                ('Savings Account', 'savings', 8750.00)
            `);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    } finally {
        client.release();
    }
}

// Middleware to log API requests
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`${req.method} ${req.path}`);
    }
    next();
});

// Accounts routes
app.get('/api/accounts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM accounts ORDER BY created_at');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch accounts:', error);
        res.status(500).json({ message: 'Failed to fetch accounts' });
    }
});

// Transactions routes
app.get('/api/transactions', async (req, res) => {
    try {
        const { accountId, category, startDate, endDate } = req.query;
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];

        if (accountId) {
            params.push(accountId);
            query += ` AND account_id = $${params.length}`;
        }
        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }
        if (startDate) {
            params.push(startDate);
            query += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            query += ` AND created_at <= $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { accountId, type, amount, description, category } = req.body;
        
        // Insert transaction
        const transactionResult = await client.query(`
            INSERT INTO transactions (account_id, type, amount, description, category) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [accountId, type, amount, description, category]);

        // Update account balance
        const balanceChange = type === 'expense' ? -parseFloat(amount) : parseFloat(amount);
        await client.query(`
            UPDATE accounts SET balance = balance + $1 WHERE id = $2
        `, [balanceChange, accountId]);

        await client.query('COMMIT');
        res.json(transactionResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to create transaction:', error);
        res.status(500).json({ message: 'Failed to create transaction' });
    } finally {
        client.release();
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        res.status(500).json({ message: 'Failed to delete transaction' });
    }
});

// Debts routes
app.get('/api/debts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM debts ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch debts:', error);
        res.status(500).json({ message: 'Failed to fetch debts' });
    }
});

app.post('/api/debts', async (req, res) => {
    try {
        const { friendName, type, amount, description } = req.body;
        const result = await pool.query(`
            INSERT INTO debts (friend_name, type, amount, description) 
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [friendName, type, amount, description]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create debt:', error);
        res.status(500).json({ message: 'Failed to create debt' });
    }
});

app.patch('/api/debts/:id', async (req, res) => {
    try {
        const { settled } = req.body;
        await pool.query('UPDATE debts SET settled = $1 WHERE id = $2', [settled, req.params.id]);
        res.json({ message: 'Debt updated successfully' });
    } catch (error) {
        console.error('Failed to update debt:', error);
        res.status(500).json({ message: 'Failed to update debt' });
    }
});

app.delete('/api/debts/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM debts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Debt deleted successfully' });
    } catch (error) {
        console.error('Failed to delete debt:', error);
        res.status(500).json({ message: 'Failed to delete debt' });
    }
});

// Reminders routes
app.get('/api/reminders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reminders ORDER BY due_date');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        res.status(500).json({ message: 'Failed to fetch reminders' });
    }
});

app.post('/api/reminders', async (req, res) => {
    try {
        const { title, description, amount, dueDate, recurring } = req.body;
        const result = await pool.query(`
            INSERT INTO reminders (title, description, amount, due_date, recurring) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [title, description, amount, dueDate, recurring]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Failed to create reminder:', error);
        res.status(500).json({ message: 'Failed to create reminder' });
    }
});

app.patch('/api/reminders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query('UPDATE reminders SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ message: 'Reminder updated successfully' });
    } catch (error) {
        console.error('Failed to update reminder:', error);
        res.status(500).json({ message: 'Failed to update reminder' });
    }
});

app.delete('/api/reminders/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM reminders WHERE id = $1', [req.params.id]);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Failed to delete reminder:', error);
        res.status(500).json({ message: 'Failed to delete reminder' });
    }
});

// Chat routes  
app.get('/api/chat/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM chat_messages ORDER BY created_at');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch chat messages:', error);
        res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
});

app.post('/api/chat/messages', async (req, res) => {
    try {
        const { content, isUser } = req.body;
        
        // Save user message
        const userResult = await pool.query(`
            INSERT INTO chat_messages (content, is_user) VALUES ($1, $2) RETURNING *
        `, [content, isUser]);

        // Generate AI response if it's a user message
        if (isUser) {
            const aiResponse = await generateAIResponse(content);
            await pool.query(`
                INSERT INTO chat_messages (content, is_user) VALUES ($1, $2)
            `, [aiResponse, false]);
        }

        res.json(userResult.rows[0]);
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

app.delete('/api/chat/messages', async (req, res) => {
    try {
        await pool.query('DELETE FROM chat_messages');
        res.json({ message: 'Chat history cleared' });
    } catch (error) {
        console.error('Failed to clear chat history:', error);
        res.status(500).json({ message: 'Failed to clear chat history' });
    }
});

// Analytics routes
app.get('/api/analytics/insights', async (req, res) => {
    try {
        const insights = await generateSpendingInsights();
        res.json(insights);
    } catch (error) {
        console.error('Failed to generate insights:', error);
        res.status(500).json({ message: 'Failed to generate insights' });
    }
});

app.get('/api/analytics/summary', async (req, res) => {
    try {
        const accountsResult = await pool.query('SELECT * FROM accounts');
        const transactionsResult = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
        const debtsResult = await pool.query('SELECT * FROM debts WHERE NOT settled');
        const remindersResult = await pool.query('SELECT * FROM reminders WHERE status = \'pending\' AND due_date > NOW() ORDER BY due_date LIMIT 5');

        const accounts = accountsResult.rows;
        const transactions = transactionsResult.rows;
        const debts = debtsResult.rows;
        const reminders = remindersResult.rows;

        const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
        
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.created_at);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        });

        const monthlySpent = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const categorySpending = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        const totalOwed = debts
            .filter(d => d.type === 'owe')
            .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        const totalOwedToUser = debts
            .filter(d => d.type === 'owed')
            .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        res.json({
            totalBalance,
            monthlySpent,
            categorySpending,
            totalOwed,
            totalOwedToUser,
            recentTransactions: transactions.slice(0, 10),
            upcomingReminders: reminders,
            activeDebts: debts.slice(0, 5)
        });
    } catch (error) {
        console.error('Failed to generate summary:', error);
        res.status(500).json({ message: 'Failed to generate summary' });
    }
});

// Simple AI response function (placeholder - would normally connect to real AI service)
async function generateAIResponse(userMessage) {
    // This is a placeholder. In a real implementation, you would call an AI service like OpenAI
    const responses = [
        "I understand you're asking about your finances. Could you provide more specific details?",
        "Based on your question, I'd recommend tracking your expenses more carefully.",
        "That's a great question about financial management. Let me analyze your data...",
        "I can help you with that. Here are some insights based on your spending patterns.",
        "Financial planning is important. Consider setting up a budget for better control."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

async function generateSpendingInsights() {
    // Placeholder for spending insights
    return {
        insights: [
            "Your food spending has increased by 15% this month",
            "You're on track to save ₹2000 this month",
            "Consider reducing entertainment expenses"
        ]
    };
}

// Catch all route - serve the main HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize database and start server
async function startServer() {
    await initializeDatabase();
    
    const port = parseInt(process.env.PORT || '5000', 10);
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer().catch(console.error);