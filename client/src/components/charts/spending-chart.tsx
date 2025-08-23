import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { type Transaction } from "@shared/schema";

interface SpendingChartProps {
  transactions: Transaction[];
  type?: "pie" | "bar";
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6B7280'];

export default function SpendingChart({ transactions, type = "pie" }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category;
        const amount = parseFloat(transaction.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      formattedValue: formatCurrency(amount),
    }));
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "pie") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="value" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
