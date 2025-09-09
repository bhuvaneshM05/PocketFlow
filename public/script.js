// ExpenseTracker - Vanilla JavaScript Application
// Global Application State
const state = {
    currentPage: 'dashboard',
    accounts: [],
    transactions: [],
    debts: [],
    reminders: [],
    chatMessages: [],
    isLoading: false
};

// API Helper Functions
const api = {
    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`/api${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    },

    get: (endpoint) => api.request('GET', endpoint),
    post: (endpoint, data) => api.request('POST', endpoint, data),
    patch: (endpoint, data) => api.request('PATCH', endpoint, data),
    delete: (endpoint) => api.request('DELETE', endpoint)
};

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTransactionAmount(type, amount) {
    const prefix = type === 'expense' ? '-' : '+';
    return `${prefix}${formatCurrency(amount)}`;
}

function getCategoryColor(category) {
    const colors = {
        food: 'bg-red-500',
        transport: 'bg-blue-500',
        entertainment: 'bg-purple-500',
        shopping: 'bg-pink-500',
        utilities: 'bg-green-500',
        education: 'bg-yellow-500',
        healthcare: 'bg-cyan-500',
        other: 'bg-gray-500'
    };
    return colors[category] || colors.other;
}

function getCategoryIcon(category) {
    const icons = {
        food: 'fas fa-utensils',
        transport: 'fas fa-car',
        entertainment: 'fas fa-film',
        shopping: 'fas fa-shopping-bag',
        utilities: 'fas fa-bolt',
        education: 'fas fa-graduation-cap',
        healthcare: 'fas fa-heartbeat',
        other: 'fas fa-ellipsis-h'
    };
    return icons[category] || icons.other;
}

// Navigation Functions
function showPage(pageName) {
    // Update state
    state.currentPage = pageName;
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation active states
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll(`[data-page="${pageName}"]`).forEach(item => {
        item.classList.add('active');
    });
    
    // Load page-specific data
    switch (pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'transactions':
            loadTransactionsData();
            break;
        case 'debts':
            loadDebtsData();
            break;
        case 'reminders':
            loadRemindersData();
            break;
        case 'chat':
            loadChatData();
            break;
    }
}

// Modal Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Set modal type for transaction modal
        if (modalId === 'expenseModal') {
            document.getElementById('expenseModalTitle').textContent = 'Add Expense';
            document.getElementById('transactionType').value = 'expense';
        } else if (modalId === 'incomeModal') {
            document.getElementById('expenseModalTitle').textContent = 'Add Income';
            document.getElementById('transactionType').value = 'income';
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        
        // Reset forms
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Loading Functions
function showLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.classList.add('active');
    }
    state.isLoading = true;
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.classList.remove('active');
    }
    state.isLoading = false;
}

// Toast Notification Functions
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-left: 1rem;">&times;</button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Data Loading Functions
async function loadAllData() {
    try {
        showLoading();
        
        const [summary, accounts, transactions, debts, reminders, chatMessages] = await Promise.all([
            api.get('/analytics/summary'),
            api.get('/accounts'),
            api.get('/transactions'),
            api.get('/debts'),
            api.get('/reminders'),
            api.get('/chat/messages')
        ]);
        
        // Update state
        state.accounts = accounts;
        state.transactions = transactions;
        state.debts = debts;
        state.reminders = reminders;
        state.chatMessages = chatMessages;
        
        // Update UI
        updateDashboard(summary);
        updateAccountSelects();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        showToast('Failed to load data. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadDashboardData() {
    try {
        const summary = await api.get('/analytics/summary');
        updateDashboard(summary);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

async function loadTransactionsData() {
    try {
        const transactions = await api.get('/transactions');
        state.transactions = transactions;
        updateTransactionsPage();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('Failed to load transactions', 'error');
    }
}

async function loadDebtsData() {
    try {
        const debts = await api.get('/debts');
        state.debts = debts;
        updateDebtsPage();
    } catch (error) {
        console.error('Failed to load debts:', error);
        showToast('Failed to load debts', 'error');
    }
}

async function loadRemindersData() {
    try {
        const reminders = await api.get('/reminders');
        state.reminders = reminders;
        updateRemindersPage();
    } catch (error) {
        console.error('Failed to load reminders:', error);
        showToast('Failed to load reminders', 'error');
    }
}

async function loadChatData() {
    try {
        const messages = await api.get('/chat/messages');
        state.chatMessages = messages;
        updateChatPage();
    } catch (error) {
        console.error('Failed to load chat messages:', error);
        showToast('Failed to load chat messages', 'error');
    }
}

// Dashboard Functions
function updateDashboard(summary) {
    // Update balance cards
    const mainAccount = summary.accounts?.find(a => a.type === 'main');
    const savingsAccount = summary.accounts?.find(a => a.type === 'savings');
    
    document.getElementById('mainAccountBalance').textContent = formatCurrency(mainAccount?.balance || 0);
    document.getElementById('savingsAccountBalance').textContent = formatCurrency(savingsAccount?.balance || 0);
    document.getElementById('monthlySpent').textContent = formatCurrency(summary.monthlySpent || 0);
    
    // Update category spending
    updateCategorySpending(summary.categorySpending || {});
    
    // Update recent transactions
    updateRecentTransactions(summary.recentTransactions || []);
    
    // Update upcoming reminders
    updateUpcomingReminders(summary.upcomingReminders || []);
    
    // Update active debts
    updateActiveDebts(summary.activeDebts || []);
}

function updateCategorySpending(categorySpending) {
    const container = document.getElementById('categorySpending');
    if (!container) return;
    
    const categories = Object.entries(categorySpending);
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="empty-state">No spending data available</p>';
        return;
    }
    
    const totalSpending = categories.reduce((sum, [, amount]) => sum + amount, 0);
    
    container.innerHTML = categories.map(([category, amount]) => {
        const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
        const colorClass = getCategoryColor(category);
        
        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color ${colorClass}"></div>
                    <span class="category-name">${category}</span>
                </div>
                <div style="text-align: right;">
                    <div class="category-amount">${formatCurrency(amount)}</div>
                    <div class="category-progress">
                        <div class="category-progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent transactions</p>';
        return;
    }
    
    container.innerHTML = transactions.slice(0, 5).map(transaction => {
        const iconClass = getCategoryIcon(transaction.category);
        const colorClass = getCategoryColor(transaction.category);
        
        return `
            <div class="transaction-item">
                <div style="display: flex; align-items: center;">
                    <div style="width: 2.5rem; height: 2.5rem; background: rgba(${colorClass === 'bg-red-500' ? '239, 68, 68' : '59, 130, 246'}, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
                        <i class="${iconClass}" style="color: var(--${colorClass.replace('bg-', '')}-color, #6b7280);"></i>
                    </div>
                    <div>
                        <p style="font-weight: 500; color: #111827;">${transaction.description}</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">
                            ${formatDateTime(transaction.createdAt)}
                        </p>
                    </div>
                </div>
                <span style="font-weight: 600; color: ${transaction.type === 'expense' ? '#dc2626' : '#16a34a'};">
                    ${formatTransactionAmount(transaction.type, transaction.amount)}
                </span>
            </div>
        `;
    }).join('');
}

function updateUpcomingReminders(reminders) {
    const container = document.getElementById('upcomingReminders');
    if (!container) return;
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="empty-state">No upcoming reminders</p>';
        return;
    }
    
    container.innerHTML = reminders.slice(0, 3).map(reminder => `
        <div class="reminder-item" style="background: rgba(245, 158, 11, 0.1); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-calendar-plus" style="color: #f59e0b; margin-right: 0.75rem;"></i>
                    <div>
                        <p style="font-weight: 500; color: #111827;">${reminder.title}</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">
                            Due ${formatDate(reminder.dueDate)}
                        </p>
                    </div>
                </div>
                <span style="font-weight: 600; color: #f59e0b;">${formatCurrency(reminder.amount)}</span>
            </div>
        </div>
    `).join('');
}

function updateActiveDebts(debts) {
    const container = document.getElementById('activeDebts');
    if (!container) return;
    
    if (debts.length === 0) {
        container.innerHTML = '<p class="empty-state">No active debts</p>';
        return;
    }
    
    container.innerHTML = debts.slice(0, 3).map(debt => {
        const bgColor = debt.type === 'owe' ? 'bg-red-50' : 'bg-green-50';
        const textColor = debt.type === 'owe' ? 'text-red-600' : 'text-green-600';
        
        return `
            <div class="debt-item ${bgColor}">
                <div style="display: flex; align-items: center;">
                    <div style="width: 2rem; height: 2rem; background: #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
                        <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">
                            ${debt.friendName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p style="font-weight: 500; color: #111827;">${debt.friendName}</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">${debt.description}</p>
                    </div>
                </div>
                <span style="font-weight: 600;" class="${textColor}">
                    ${debt.type === 'owe' ? '-' : '+'}${formatCurrency(debt.amount)}
                </span>
            </div>
        `;
    }).join('');
}

// Transactions Page Functions
function updateTransactionsPage() {
    const container = document.getElementById('allTransactions');
    if (!container) return;
    
    if (state.transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions found</p>';
        return;
    }
    
    container.innerHTML = state.transactions.map(transaction => {
        const iconClass = getCategoryIcon(transaction.category);
        const account = state.accounts.find(a => a.id === transaction.accountId);
        
        return `
            <div class="transaction-item">
                <div style="display: flex; align-items: center; flex: 1;">
                    <div style="width: 2.5rem; height: 2.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
                        <i class="${iconClass}" style="color: #3b82f6;"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="font-weight: 500; color: #111827;">${transaction.description}</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">
                            ${formatDateTime(transaction.createdAt)} • ${transaction.category} • ${account?.name || 'Unknown Account'}
                        </p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-weight: 600; color: ${transaction.type === 'expense' ? '#dc2626' : '#16a34a'};">
                        ${formatTransactionAmount(transaction.type, transaction.amount)}
                    </span>
                    <button onclick="deleteTransaction('${transaction.id}')" style="background: none; border: none; color: #dc2626; cursor: pointer; padding: 0.25rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Debts Page Functions
function updateDebtsPage() {
    const container = document.getElementById('allDebts');
    if (!container) return;
    
    if (state.debts.length === 0) {
        container.innerHTML = '<p class="empty-state">No debts or loans</p>';
        return;
    }
    
    const activeDebts = state.debts.filter(debt => !debt.settled);
    
    container.innerHTML = activeDebts.map(debt => {
        const bgColor = debt.type === 'owe' ? 'bg-red-50' : 'bg-green-50';
        const textColor = debt.type === 'owe' ? 'text-red-600' : 'text-green-600';
        
        return `
            <div class="debt-item ${bgColor}">
                <div style="display: flex; align-items: center; flex: 1;">
                    <div style="width: 2.5rem; height: 2.5rem; background: #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem;">
                        <span style="font-size: 0.875rem; font-weight: 500; color: #374151;">
                            ${debt.friendName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div style="flex: 1;">
                        <p style="font-weight: 500; color: #111827;">${debt.friendName}</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">${debt.description}</p>
                        <p style="font-size: 0.75rem; color: #9ca3af;">
                            ${debt.type === 'owe' ? 'You owe' : 'They owe you'}
                        </p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: 600;" class="${textColor}">
                        ${formatCurrency(debt.amount)}
                    </span>
                    <br>
                    <button onclick="settleDebt('${debt.id}')" style="background: none; border: none; color: #6b7280; font-size: 0.75rem; cursor: pointer; margin-top: 0.25rem;">
                        Mark as settled
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Reminders Page Functions
function updateRemindersPage() {
    const container = document.getElementById('allReminders');
    if (!container) return;
    
    if (state.reminders.length === 0) {
        container.innerHTML = '<p class="empty-state">No reminders set</p>';
        return;
    }
    
    container.innerHTML = state.reminders.map(reminder => {
        const isOverdue = new Date(reminder.dueDate) < new Date() && reminder.status === 'pending';
        const statusColors = {
            pending: 'background: #fef3c7; color: #92400e;',
            paid: 'background: #d1fae5; color: #065f46;',
            snoozed: 'background: #dbeafe; color: #1e40af;'
        };
        
        return `
            <div class="reminder-item" style="border: 1px solid ${isOverdue ? '#fca5a5' : '#e5e7eb'}; ${isOverdue ? 'background: #fef2f2;' : ''}">
                <div style="flex: 1;">
                    <h4 style="font-weight: 600; color: #111827; margin-bottom: 0.5rem;">${reminder.title}</h4>
                    ${reminder.description ? `<p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${reminder.description}</p>` : ''}
                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">
                        <i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>
                        ${formatDateTime(reminder.dueDate)}
                    </p>
                    <p style="font-size: 0.875rem; font-weight: 600; color: #111827;">${formatCurrency(reminder.amount)}</p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; ${statusColors[reminder.status]}">
                        ${reminder.status}
                    </span>
                    ${reminder.status === 'pending' ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="updateReminderStatus('${reminder.id}', 'paid')" style="background: none; border: none; color: #16a34a; font-size: 0.75rem; cursor: pointer;">
                                Mark Paid
                            </button>
                            <button onclick="updateReminderStatus('${reminder.id}', 'snoozed')" style="background: none; border: none; color: #3b82f6; font-size: 0.75rem; cursor: pointer;">
                                Snooze
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Chat Page Functions
function updateChatPage() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (state.chatMessages.length === 0) {
        container.innerHTML = `
            <div class="message bot">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    Hello! I'm your AI financial assistant. I can help you track expenses, analyze spending patterns, and provide financial insights. What would you like to know?
                    <span class="message-time">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.chatMessages.map(message => `
        <div class="message ${message.isUser ? 'user' : 'bot'}">
            <div class="message-avatar">
                <i class="fas fa-${message.isUser ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                ${message.content.replace(/\n/g, '<br>')}
                <span class="message-time">${new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Form Submission Functions
async function submitTransaction(event, type = null) {
    event.preventDefault();
    
    const form = event.target;
    
    // Determine transaction type
    const transactionType = type || document.getElementById('transactionType').value;
    
    // Get form values based on modal type
    let amount, description, category, accountId;
    
    if (type === 'income') {
        amount = document.getElementById('incomeAmount').value;
        description = document.getElementById('incomeDescription').value;
        category = document.getElementById('incomeCategory').value;
        accountId = document.getElementById('incomeAccount').value;
    } else {
        amount = document.getElementById('amount').value;
        description = document.getElementById('description').value;
        category = document.getElementById('category').value;
        accountId = document.getElementById('account').value;
    }
    
    // Validate required fields
    if (!accountId || !amount || !description || !category) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    
    const data = {
        accountId,
        type: transactionType,
        amount: amount.toString(), // Send as string to match decimal type
        description,
        category
    };
    
    console.log('Submitting transaction data:', data);
    console.log('Transaction data JSON:', JSON.stringify(data));
    
    try {
        const response = await api.post('/transactions', data);
        console.log('Transaction response:', response);
        
        // Close modal and reset form
        if (type === 'income') {
            closeModal('incomeModal');
        } else {
            closeModal('expenseModal');
        }
        
        // Reload data
        await loadAllData();
        showToast('Transaction added successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to add transaction:', error);
        console.error('Error details:', error.response?.data);
        showToast('Failed to add transaction. Please try again.', 'error');
    }
}

async function submitDebt(event) {
    event.preventDefault();
    
    const friendName = document.getElementById('debtFriend').value;
    const amount = document.getElementById('debtAmount').value;
    const description = document.getElementById('debtDescription').value;
    const type = document.getElementById('debtType').value;
    
    // Validate required fields
    if (!friendName || !amount || !description || !type) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    
    const data = {
        friendName,
        amount: amount.toString(), // Send as string to match decimal type
        description,
        type
    };
    
    console.log('Submitting debt data:', data);
    
    try {
        await api.post('/debts', data);
        closeModal('debtModal');
        await loadAllData();
        showToast('Debt added successfully!', 'success');
    } catch (error) {
        console.error('Failed to add debt:', error);
        showToast('Failed to add debt. Please try again.', 'error');
    }
}

async function submitReminder(event) {
    event.preventDefault();
    
    const title = document.getElementById('reminderTitle').value;
    const amount = document.getElementById('reminderAmount').value;
    const dueDate = document.getElementById('reminderDate').value;
    const description = document.getElementById('reminderDescription').value;
    
    // Validate required fields
    if (!title || !amount || !dueDate) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    
    const data = {
        title,
        amount: amount.toString(), // Send as string to match decimal type
        dueDate: new Date(dueDate).toISOString(), // Convert to ISO string
        description: description || undefined // Don't send null, use undefined
    };
    
    console.log('Submitting reminder data:', data);
    
    try {
        await api.post('/reminders', data);
        closeModal('reminderModal');
        await loadAllData();
        showToast('Reminder set successfully!', 'success');
    } catch (error) {
        console.error('Failed to add reminder:', error);
        showToast('Failed to set reminder. Please try again.', 'error');
    }
}

// Action Functions
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
        await api.delete(`/transactions/${id}`);
        await loadAllData();
        showToast('Transaction deleted successfully!', 'success');
    } catch (error) {
        console.error('Failed to delete transaction:', error);
        showToast('Failed to delete transaction.', 'error');
    }
}

async function settleDebt(id) {
    if (!confirm('Mark this debt as settled?')) return;
    
    try {
        await api.patch(`/debts/${id}`, { settled: true });
        await loadAllData();
        showToast('Debt marked as settled!', 'success');
    } catch (error) {
        console.error('Failed to settle debt:', error);
        showToast('Failed to settle debt.', 'error');
    }
}

async function updateReminderStatus(id, status) {
    try {
        await api.patch(`/reminders/${id}`, { status });
        await loadAllData();
        showToast(`Reminder marked as ${status}!`, 'success');
    } catch (error) {
        console.error('Failed to update reminder:', error);
        showToast('Failed to update reminder.', 'error');
    }
}

// Chat Functions
async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    // Clear input and disable form
    input.value = '';
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    // Add typing indicator
    addTypingIndicator();
    
    try {
        await api.post('/chat/messages', {
            content,
            isUser: true
        });
        
        // Wait a moment for AI response
        setTimeout(async () => {
            await loadChatData();
            removeTypingIndicator();
            sendBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Failed to send message:', error);
        showToast('Failed to send message. Please try again.', 'error');
        removeTypingIndicator();
        sendBtn.disabled = false;
    }
}

function addTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) {
        typing.remove();
    }
}

async function clearChat() {
    if (!confirm('Are you sure you want to clear the chat history?')) return;
    
    try {
        await api.delete('/chat/messages');
        await loadChatData();
        showToast('Chat history cleared!', 'success');
    } catch (error) {
        console.error('Failed to clear chat:', error);
        showToast('Failed to clear chat history.', 'error');
    }
}

function setQuickMessage(message) {
    const input = document.getElementById('messageInput');
    input.value = message;
    input.focus();
}

// Utility Functions
function updateAccountSelects() {
    const selects = ['account', 'incomeAccount'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select && state.accounts.length > 0) {
            select.innerHTML = '<option value="">Select Account</option>' + 
                state.accounts.map(account => 
                    `<option value="${account.id}">${account.name} (${formatCurrency(account.balance)})</option>`
                ).join('');
        }
    });
}

function setCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Form submissions
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', submitTransaction);
    }
    
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', (e) => submitTransaction(e, 'income'));
    }
    
    const debtForm = document.getElementById('debtForm');
    if (debtForm) {
        debtForm.addEventListener('submit', submitDebt);
    }
    
    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) {
        reminderForm.addEventListener('submit', submitReminder);
    }
    
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', sendMessage);
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('ExpenseTracker - Vanilla JS Version Loaded');
    
    // Set current date
    setCurrentDate();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadAllData();
    
    // Auto-refresh data every 30 seconds
    setInterval(loadAllData, 30000);
});

// Make functions globally available for onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showPage = showPage;
window.submitTransaction = submitTransaction;
window.submitDebt = submitDebt;
window.submitReminder = submitReminder;
window.deleteTransaction = deleteTransaction;
window.settleDebt = settleDebt;
window.updateReminderStatus = updateReminderStatus;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.setQuickMessage = setQuickMessage;