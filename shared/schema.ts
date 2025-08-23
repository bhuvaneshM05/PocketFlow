import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountTypeEnum = pgEnum("account_type", ["main", "savings", "other"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["expense", "income"]);
export const categoryEnum = pgEnum("category", ["food", "transport", "entertainment", "study", "mess", "other"]);
export const debtTypeEnum = pgEnum("debt_type", ["owe", "owed"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["pending", "paid", "snoozed"]);

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull().default("main"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const debts = pgTable("debts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  friendName: text("friend_name").notNull(),
  type: debtTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  settled: boolean("settled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: reminderStatusEnum("status").notNull().default("pending"),
  recurring: boolean("recurring").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true, settled: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
