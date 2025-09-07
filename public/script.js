// App state
const state = {
    currentPage: 'dashboard',
    accounts: [],
    transactions: [],
    debts: [],
    reminders: [],
    chatMessages: []
};

// API functions
const api = {
    async get(endpoint) {
        const response = await fetch(`/api${endpoint}`);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`/api${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return response.json();
    },

    async delete(endpoint) {
        const response = await fetch(`/api${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        return response.json();
    }
};

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Navigation
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    document.getElementById(`${pageName}-page`).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });

    document.querySelectorAll(`[data-page="${pageName}"]`).forEach(link => {
        link.classList.add('active');
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        debts: 'Debts',
        reminders: 'Reminders',
        chat: 'AI Chat'
    };
    document.getElementById('page-title').textContent = titles[pageName];

    state.currentPage = pageName;
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Data loading functions
async function loadData() {
    try {
        const [accounts, transactions, debts, reminders, chatMessages] = await Promise.all([
            api.get('/accounts'),
            api.get('/transactions'),
            api.get('/debts'),
            api.get('/reminders'),
            api.get('/chat/messages')
        ]);

        state.accounts = accounts;
        state.transactions = transactions;
        state.debts = debts;
        state.reminders = reminders;
        state.chatMessages = chatMessages;

        updateDashboard();
        updateTransactionsPage();
        updateDebtsPage();
        updateRemindersPage();
        updateChatPage();
        populateAccountSelect();
    } catch (error) {
        console.error('Failed to load data:', error);
        showError('Failed to load data. Please refresh the page.');
    }
}

// Dashboard functions
async function updateDashboard() {
    try {
        const summary = await api.get('/analytics/summary');
        
        document.getElementById('total-balance').textContent = formatCurrency(summary.totalBalance);
        document.getElementById('monthly-spending').textContent = formatCurrency(summary.monthlySpent);
        document.getElementById('money-owed').textContent = formatCurrency(summary.totalOwed);
        document.getElementById('money-owed-to-you').textContent = formatCurrency(summary.totalOwedToUser);

        // Update recent transactions
        const recentTransactionsHtml = summary.recentTransactions.length > 0 
            ? summary.recentTransactions.map(transaction => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-900">${transaction.description}</p>
                        <p class="text-sm text-gray-500">${formatDate(transaction.createdAt)} • ${transaction.category}</p>
                    </div>
                    <span class="font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}">
                        ${transaction.type === 'expense' ? '-' : '+'}${formatCurrency(transaction.amount)}
                    </span>
                </div>
            `).join('')
            : '<p class="text-gray-500">No transactions yet</p>';

        document.getElementById('recent-transactions').innerHTML = recentTransactionsHtml;

        // Update category spending
        const categorySpendingHtml = Object.keys(summary.categorySpending).length > 0
            ? Object.entries(summary.categorySpending).map(([category, amount]) => `
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 capitalize">${category}</span>
                    <span class="font-semibold text-gray-900">${formatCurrency(amount)}</span>
                </div>
            `).join('')
            : '<p class="text-gray-500">No spending data</p>';

        document.getElementById('category-spending').innerHTML = categorySpendingHtml;

        // Update notification count
        const pendingReminders = summary.upcomingReminders.filter(r => r.status === 'pending').length;
        document.getElementById('notification-count').textContent = pendingReminders;
        document.getElementById('notification-count').style.display = pendingReminders > 0 ? 'flex' : 'none';
    } catch (error) {
        console.error('Failed to update dashboard:', error);
    }
}

// Transactions functions
function updateTransactionsPage() {
    const tbody = document.getElementById('transactions-tbody');
    
    if (state.transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = state.transactions.map(transaction => {
        const account = state.accounts.find(a => a.id === transaction.accountId);
        return `
            <tr>
                <td class="px-6 py-4 text-sm text-gray-900">${formatDate(transaction.createdAt)}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${transaction.description}</td>
                <td class="px-6 py-4 text-sm text-gray-500 capitalize">${transaction.category}</td>
                <td class="px-6 py-4 text-sm font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}">
                    ${transaction.type === 'expense' ? '-' : '+'}${formatCurrency(transaction.amount)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 capitalize">${transaction.type}</td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    <button onclick="deleteTransaction('${transaction.id}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await api.delete(`/transactions/${id}`);
        await loadData();
        showSuccess('Transaction deleted successfully');
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        showError('Failed to delete transaction');
    }
}

// Debts functions
function updateDebtsPage() {
    const moneyIOwe = document.getElementById('money-i-owe');
    const moneyOwedToMe = document.getElementById('money-owed-to-me');

    const debtsIOwe = state.debts.filter(d => d.type === 'owe' && !d.settled);
    const debtsOwedToMe = state.debts.filter(d => d.type === 'owed' && !d.settled);

    moneyIOwe.innerHTML = debtsIOwe.length > 0 
        ? debtsIOwe.map(debt => `
            <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900">${debt.friendName}</p>
                    <p class="text-sm text-gray-500">${debt.description}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-red-600">${formatCurrency(debt.amount)}</p>
                    <button onclick="settleDebt('${debt.id}')" class="text-xs text-gray-500 hover:text-gray-700 mt-1">
                        Mark as settled
                    </button>
                </div>
            </div>
        `).join('')
        : '<p class="text-gray-500">No debts</p>';

    moneyOwedToMe.innerHTML = debtsOwedToMe.length > 0
        ? debtsOwedToMe.map(debt => `
            <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                    <p class="font-medium text-gray-900">${debt.friendName}</p>
                    <p class="text-sm text-gray-500">${debt.description}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-green-600">${formatCurrency(debt.amount)}</p>
                    <button onclick="settleDebt('${debt.id}')" class="text-xs text-gray-500 hover:text-gray-700 mt-1">
                        Mark as settled
                    </button>
                </div>
            </div>
        `).join('')
        : '<p class="text-gray-500">No debts</p>';
}

async function settleDebt(id) {
    try {
        await api.put(`/debts/${id}`, { settled: true });
        await loadData();
        showSuccess('Debt marked as settled');
    } catch (error) {
        console.error('Failed to settle debt:', error);
        showError('Failed to settle debt');
    }
}

// Reminders functions
function updateRemindersPage() {
    const remindersList = document.getElementById('reminders-list');

    if (state.reminders.length === 0) {
        remindersList.innerHTML = '<p class="text-gray-500">No reminders</p>';
        return;
    }

    remindersList.innerHTML = state.reminders.map(reminder => {
        const isOverdue = new Date(reminder.dueDate) < new Date() && reminder.status === 'pending';
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
            snoozed: 'bg-blue-100 text-blue-800'
        };

        return `
            <div class="flex justify-between items-start p-4 border border-gray-200 rounded-lg ${isOverdue ? 'border-red-300 bg-red-50' : ''}">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${reminder.title}</h4>
                    ${reminder.description ? `<p class="text-sm text-gray-600 mt-1">${reminder.description}</p>` : ''}
                    <p class="text-sm text-gray-500 mt-2">
                        <i class="fas fa-calendar mr-1"></i>
                        ${formatDateTime(reminder.dueDate)}
                    </p>
                    <p class="text-sm font-semibold text-gray-900 mt-1">${formatCurrency(reminder.amount)}</p>
                </div>
                <div class="flex flex-col items-end space-y-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[reminder.status]}">
                        ${reminder.status}
                    </span>
                    ${reminder.status === 'pending' ? `
                        <div class="flex space-x-1">
                            <button onclick="updateReminderStatus('${reminder.id}', 'paid')" class="text-xs text-green-600 hover:text-green-800">
                                Mark Paid
                            </button>
                            <button onclick="updateReminderStatus('${reminder.id}', 'snoozed')" class="text-xs text-blue-600 hover:text-blue-800">
                                Snooze
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function updateReminderStatus(id, status) {
    try {
        await api.put(`/reminders/${id}`, { status });
        await loadData();
        showSuccess(`Reminder marked as ${status}`);
    } catch (error) {
        console.error('Failed to update reminder:', error);
        showError('Failed to update reminder');
    }
}

// Chat functions
function updateChatPage() {
    const chatMessages = document.getElementById('chat-messages');
    
    if (state.chatMessages.length === 0) {
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-content">
                    Hello! I'm your AI financial assistant. I can help you track expenses, analyze spending patterns, and provide financial insights. What would you like to know?
                </div>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = state.chatMessages.map(message => `
        <div class="message ${message.isUser ? 'user-message' : 'ai-message'}">
            <div class="message-content">
                ${message.content}
            </div>
        </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage(content) {
    try {
        await api.post('/chat/messages', { content, isUser: true });
        await loadData();
    } catch (error) {
        console.error('Failed to send chat message:', error);
        showError('Failed to send message');
    }
}

async function clearChatHistory() {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
        await api.delete('/chat/messages');
        await loadData();
        showSuccess('Chat history cleared');
    } catch (error) {
        console.error('Failed to clear chat history:', error);
        showError('Failed to clear chat history');
    }
}

// Form handlers
function populateAccountSelect() {
    const select = document.getElementById('transaction-account');
    select.innerHTML = state.accounts.map(account => 
        `<option value="${account.id}">${account.name} (${formatCurrency(account.balance)})</option>`
    ).join('');
}

// Notification functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Navigation event listeners
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Modal event listeners
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Add transaction button
    document.getElementById('add-transaction-btn').addEventListener('click', function() {
        openModal('transaction-modal');
    });

    // Add debt button
    document.getElementById('add-debt-btn').addEventListener('click', function() {
        openModal('debt-modal');
    });

    // Add reminder button
    document.getElementById('add-reminder-btn').addEventListener('click', function() {
        openModal('reminder-modal');
    });

    // Clear chat button
    document.getElementById('clear-chat-btn').addEventListener('click', clearChatHistory);

    // Form submissions
    document.getElementById('transaction-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            accountId: document.getElementById('transaction-account').value,
            type: document.getElementById('transaction-type').value,
            amount: document.getElementById('transaction-amount').value,
            description: document.getElementById('transaction-description').value,
            category: document.getElementById('transaction-category').value
        };

        try {
            await api.post('/transactions', data);
            await loadData();
            closeModal('transaction-modal');
            this.reset();
            showSuccess('Transaction added successfully');
        } catch (error) {
            console.error('Failed to add transaction:', error);
            showError('Failed to add transaction');
        }
    });

    document.getElementById('debt-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            friendName: document.getElementById('debt-friend-name').value,
            type: document.getElementById('debt-type').value,
            amount: document.getElementById('debt-amount').value,
            description: document.getElementById('debt-description').value
        };

        try {
            await api.post('/debts', data);
            await loadData();
            closeModal('debt-modal');
            this.reset();
            showSuccess('Debt added successfully');
        } catch (error) {
            console.error('Failed to add debt:', error);
            showError('Failed to add debt');
        }
    });

    document.getElementById('reminder-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            title: document.getElementById('reminder-title').value,
            description: document.getElementById('reminder-description').value,
            amount: document.getElementById('reminder-amount').value,
            dueDate: new Date(document.getElementById('reminder-due-date').value).toISOString(),
            recurring: document.getElementById('reminder-recurring').checked
        };

        try {
            await api.post('/reminders', data);
            await loadData();
            closeModal('reminder-modal');
            this.reset();
            showSuccess('Reminder added successfully');
        } catch (error) {
            console.error('Failed to add reminder:', error);
            showError('Failed to add reminder');
        }
    });

    document.getElementById('chat-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const content = input.value.trim();
        
        if (!content) return;

        input.value = '';
        await sendChatMessage(content);
    });

    // Load initial data
    loadData();
});

// Make functions globally available
window.closeModal = closeModal;
window.deleteTransaction = deleteTransaction;
window.settleDebt = settleDebt;
window.updateReminderStatus = updateReminderStatus;