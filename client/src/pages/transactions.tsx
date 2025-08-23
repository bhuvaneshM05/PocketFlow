import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2 } from "lucide-react";
import { formatCurrency, getCategoryColor, getCategoryIcon, formatTransactionAmount } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Transaction, type Account } from "@shared/schema";

export default function Transactions() {
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions", accountFilter, categoryFilter, dateFilter],
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    const csvContent = [
      ["Date", "Description", "Category", "Account", "Amount", "Type"],
      ...transactions.map((t: Transaction) => [
        new Date(t.createdAt).toLocaleDateString('en-IN'),
        t.description,
        t.category,
        accounts.find((a: Account) => a.id === t.accountId)?.name || "",
        t.amount,
        t.type,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate running balance
  const transactionsWithBalance = transactions.reduce((acc, transaction, index) => {
    const account = accounts.find((a: Account) => a.id === transaction.accountId);
    const currentBalance = account ? parseFloat(account.balance) : 0;
    
    // For simplicity, show current balance for all transactions
    // In a real app, you'd calculate historical balances
    acc.push({
      ...transaction,
      balance: currentBalance,
    });
    return acc;
  }, [] as (Transaction & { balance: number })[]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-[200px]" data-testid="filter-account">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account: Account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]" data-testid="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="study">Study Materials</SelectItem>
                  <SelectItem value="mess">Mess</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[200px]"
                data-testid="filter-date"
              />
            </div>

            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center"
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bank Statement View */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <p className="text-sm text-gray-500">Bank statement style view of all your transactions</p>
        </CardHeader>
        <CardContent>
          {transactionsWithBalance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsWithBalance.map((transaction) => {
                    const account = accounts.find((a: Account) => a.id === transaction.accountId);
                    return (
                      <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(transaction.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 ${getCategoryColor(transaction.category)}/20 rounded-full flex items-center justify-center mr-3`}>
                              <i className={`${getCategoryIcon(transaction.category)} ${getCategoryColor(transaction.category).replace('bg-', 'text-')} text-sm`} />
                            </div>
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={`${getCategoryColor(transaction.category)}/20 ${getCategoryColor(transaction.category).replace('bg-', 'text-')}`}
                          >
                            {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {account?.name || "Unknown"}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatTransactionAmount(transaction.type, transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right text-gray-900">
                          {formatCurrency(transaction.balance)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                            disabled={deleteTransactionMutation.isPending}
                            data-testid={`button-delete-${transaction.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
