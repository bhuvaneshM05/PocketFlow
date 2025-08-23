import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wallet, PiggyBank, TrendingUp, Plus, Minus, HandHeart, CalendarPlus, ArrowRight } from "lucide-react";
import { formatCurrency, getCategoryColor, getCategoryIcon, formatTransactionAmount } from "@/lib/currency";
import ExpenseModal from "@/components/forms/expense-modal";
import DebtModal from "@/components/forms/debt-modal";
import ReminderModal from "@/components/forms/reminder-modal";
import SpendingChart from "@/components/charts/spending-chart";
import { Link } from "wouter";
import { type Account, type Transaction, type Debt, type Reminder } from "@shared/schema";

export default function Dashboard() {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const accounts: Account[] = summary?.accounts || [];
  const recentTransactions: Transaction[] = summary?.recentTransactions || [];
  const upcomingReminders: Reminder[] = summary?.upcomingReminders || [];
  const activeDebts: Debt[] = summary?.activeDebts || [];
  const categorySpending = summary?.categorySpending || {};

  const mainAccount = accounts.find(a => a.type === "main");
  const savingsAccount = accounts.find(a => a.type === "savings");

  const totalBalance = summary?.totalBalance || 0;
  const monthlySpent = summary?.monthlySpent || 0;
  const totalOwed = summary?.totalOwed || 0;
  const totalOwedToUser = summary?.totalOwedToUser || 0;

  // Calculate category data with percentages
  const totalCategorySpending = Object.values(categorySpending).reduce((sum: number, amount) => sum + amount, 0);
  const categoryData = Object.entries(categorySpending).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalCategorySpending > 0 ? (amount / totalCategorySpending) * 100 : 0,
  }));

  return (
    <div className="p-4 space-y-6">
      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Main Account</p>
                <p className="text-2xl font-bold" data-testid="main-account-balance">
                  {formatCurrency(mainAccount?.balance || 0)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Savings Account</p>
                <p className="text-2xl font-bold" data-testid="savings-account-balance">
                  {formatCurrency(savingsAccount?.balance || 0)}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-accent to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">This Month Spent</p>
                <p className="text-2xl font-bold" data-testid="monthly-spent">
                  {formatCurrency(monthlySpent)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-primary/10 hover:bg-primary/20 text-primary"
              onClick={() => setExpenseModalOpen(true)}
              data-testid="button-add-expense"
            >
              <Minus className="h-6 w-6" />
              <span className="text-sm font-medium">Add Expense</span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-secondary/10 hover:bg-secondary/20 text-secondary"
              onClick={() => setIncomeModalOpen(true)}
              data-testid="button-add-income"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add Income</span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-accent/10 hover:bg-accent/20 text-accent"
              onClick={() => setDebtModalOpen(true)}
              data-testid="button-track-debt"
            >
              <HandHeart className="h-6 w-6" />
              <span className="text-sm font-medium">Track Debt</span>
            </Button>

            <Button
              variant="ghost"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-purple-100 hover:bg-purple-200 text-purple-600"
              onClick={() => setReminderModalOpen(true)}
              data-testid="button-set-reminder"
            >
              <CalendarPlus className="h-6 w-6" />
              <span className="text-sm font-medium">Set Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spending Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map(({ category, amount, percentage }) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${getCategoryColor(category)} mr-3`} />
                      <span className="font-medium text-gray-700 capitalize">{category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{formatCurrency(amount)}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`${getCategoryColor(category)} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" data-testid="link-all-transactions">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${getCategoryColor(transaction.category)}/20 rounded-full flex items-center justify-center mr-3`}>
                        <i className={`${getCategoryIcon(transaction.category)} ${getCategoryColor(transaction.category).replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatTransactionAmount(transaction.type, transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Reminders & Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Reminders</CardTitle>
              <Link href="/reminders">
                <Button variant="ghost" size="sm" data-testid="link-all-reminders">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center">
                      <CalendarPlus className="text-accent mr-3 h-5 w-5" />
                      <div>
                        <p className="font-medium text-gray-900">{reminder.title}</p>
                        <p className="text-sm text-gray-500">
                          Due {new Date(reminder.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-accent">{formatCurrency(reminder.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No upcoming reminders
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Debts</CardTitle>
              <Link href="/debts">
                <Button variant="ghost" size="sm" data-testid="link-all-debts">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeDebts.length > 0 ? (
              <div className="space-y-3">
                {activeDebts.slice(0, 3).map((debt) => (
                  <div key={debt.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    debt.type === 'owe' ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-700">
                          {debt.friendName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{debt.friendName}</p>
                        <p className="text-sm text-gray-500">{debt.description}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      debt.type === 'owe' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {debt.type === 'owe' ? '-' : '+'}{formatCurrency(debt.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No active debts
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        type="expense"
      />
      <ExpenseModal
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
        type="income"
      />
      <DebtModal
        open={debtModalOpen}
        onOpenChange={setDebtModalOpen}
      />
      <ReminderModal
        open={reminderModalOpen}
        onOpenChange={setReminderModalOpen}
      />
    </div>
  );
}
