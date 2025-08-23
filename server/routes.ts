import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse, generateSpendingInsights } from "./services/gemini";
import { insertTransactionSchema, insertDebtSchema, insertReminderSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Accounts routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Transactions routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { accountId, category, startDate, endDate } = req.query;
      const transactions = await storage.getTransactions(
        accountId as string,
        category as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await storage.deleteTransaction(req.params.id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Debts routes
  app.get("/api/debts", async (req, res) => {
    try {
      const debts = await storage.getDebts();
      res.json(debts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch debts" });
    }
  });

  app.post("/api/debts", async (req, res) => {
    try {
      const validatedData = insertDebtSchema.parse(req.body);
      const debt = await storage.createDebt(validatedData);
      res.json(debt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid debt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create debt" });
      }
    }
  });

  app.patch("/api/debts/:id", async (req, res) => {
    try {
      await storage.updateDebt(req.params.id, req.body);
      res.json({ message: "Debt updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update debt" });
    }
  });

  app.delete("/api/debts/:id", async (req, res) => {
    try {
      await storage.deleteDebt(req.params.id);
      res.json({ message: "Debt deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete debt" });
    }
  });

  // Reminders routes
  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const validatedData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(validatedData);
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid reminder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create reminder" });
      }
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      await storage.updateReminder(req.params.id, req.body);
      res.json({ message: "Reminder updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      await storage.deleteReminder(req.params.id);
      res.json({ message: "Reminder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Save user message
      const userMessage = await storage.createChatMessage(validatedData);
      
      // Generate AI response if it's a user message
      if (validatedData.isUser) {
        const aiResponse = await generateAIResponse(validatedData.content);
        
        // Save AI response
        await storage.createChatMessage({
          content: aiResponse,
          isUser: false
        });
      }
      
      res.json(userMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  app.delete("/api/chat/messages", async (req, res) => {
    try {
      await storage.clearChatMessages();
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/insights", async (req, res) => {
    try {
      const insights = await generateSpendingInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      const transactions = await storage.getTransactions();
      const debts = await storage.getDebts();
      const reminders = await storage.getReminders();

      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.createdAt);
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
        }, {} as Record<string, number>);

      const totalOwed = debts
        .filter(d => d.type === 'owe' && !d.settled)
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const totalOwedToUser = debts
        .filter(d => d.type === 'owed' && !d.settled)
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const upcomingReminders = reminders
        .filter(r => r.status === 'pending' && r.dueDate > new Date())
        .slice(0, 5);

      res.json({
        totalBalance,
        monthlySpent,
        categorySpending,
        totalOwed,
        totalOwedToUser,
        recentTransactions: transactions.slice(0, 10),
        upcomingReminders,
        activeDebts: debts.filter(d => !d.settled).slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
