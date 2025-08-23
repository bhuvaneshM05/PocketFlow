import { 
  type Account, type InsertAccount,
  type Transaction, type InsertTransaction,
  type Debt, type InsertDebt,
  type Reminder, type InsertReminder,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(id: string, balance: string): Promise<void>;

  // Transactions
  getTransactions(accountId?: string, category?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Debts
  getDebts(): Promise<Debt[]>;
  getDebt(id: string): Promise<Debt | undefined>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  updateDebt(id: string, updates: Partial<Debt>): Promise<void>;
  deleteDebt(id: string): Promise<void>;

  // Reminders
  getReminders(): Promise<Reminder[]>;
  getReminder(id: string): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<void>;
  deleteReminder(id: string): Promise<void>;

  // Chat Messages
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private debts: Map<string, Debt> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();

  constructor() {
    // Initialize with default accounts
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Create default accounts
    const mainAccount: Account = {
      id: randomUUID(),
      name: "Main Account",
      type: "main",
      balance: "2450.00",
      createdAt: new Date(),
    };

    const savingsAccount: Account = {
      id: randomUUID(),
      name: "Savings Account", 
      type: "savings",
      balance: "8750.00",
      createdAt: new Date(),
    };

    this.accounts.set(mainAccount.id, mainAccount);
    this.accounts.set(savingsAccount.id, savingsAccount);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = randomUUID();
    const account: Account = {
      ...insertAccount,
      id,
      createdAt: new Date(),
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccountBalance(id: string, balance: string): Promise<void> {
    const account = this.accounts.get(id);
    if (account) {
      account.balance = balance;
      this.accounts.set(id, account);
    }
  }

  // Transactions
  async getTransactions(accountId?: string, category?: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());

    if (accountId) {
      transactions = transactions.filter(t => t.accountId === accountId);
    }
    if (category) {
      transactions = transactions.filter(t => t.category === category);
    }
    if (startDate) {
      transactions = transactions.filter(t => t.createdAt >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.createdAt <= endDate);
    }

    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);

    // Update account balance
    const account = this.accounts.get(insertTransaction.accountId);
    if (account) {
      const currentBalance = parseFloat(account.balance);
      const transactionAmount = parseFloat(insertTransaction.amount);
      const newBalance = insertTransaction.type === "expense" 
        ? currentBalance - transactionAmount 
        : currentBalance + transactionAmount;
      await this.updateAccountBalance(insertTransaction.accountId, newBalance.toFixed(2));
    }

    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    this.transactions.delete(id);
  }

  // Debts
  async getDebts(): Promise<Debt[]> {
    return Array.from(this.debts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDebt(id: string): Promise<Debt | undefined> {
    return this.debts.get(id);
  }

  async createDebt(insertDebt: InsertDebt): Promise<Debt> {
    const id = randomUUID();
    const debt: Debt = {
      ...insertDebt,
      id,
      settled: false,
      createdAt: new Date(),
    };
    this.debts.set(id, debt);
    return debt;
  }

  async updateDebt(id: string, updates: Partial<Debt>): Promise<void> {
    const debt = this.debts.get(id);
    if (debt) {
      Object.assign(debt, updates);
      this.debts.set(id, debt);
    }
  }

  async deleteDebt(id: string): Promise<void> {
    this.debts.delete(id);
  }

  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date(),
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    const reminder = this.reminders.get(id);
    if (reminder) {
      Object.assign(reminder, updates);
      this.reminders.set(id, reminder);
    }
  }

  async deleteReminder(id: string): Promise<void> {
    this.reminders.delete(id);
  }

  // Chat Messages
  async getChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async clearChatMessages(): Promise<void> {
    this.chatMessages.clear();
  }
}

export const storage = new MemStorage();
