import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Scale, Plus, Check, MessageCircle, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DebtModal from "@/components/forms/debt-modal";
import { type Debt } from "@shared/schema";

export default function Debts() {
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["/api/debts"],
  });

  const updateDebtMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Debt> }) => {
      return await apiRequest("PATCH", `/api/debts/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Debt updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update debt",
        variant: "destructive",
      });
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/debts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Debt deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete debt",
        variant: "destructive",
      });
    },
  });

  const activeDebts = debts.filter((debt: Debt) => !debt.settled);
  const settledDebts = debts.filter((debt: Debt) => debt.settled);

  const totalOwed = activeDebts
    .filter((debt: Debt) => debt.type === 'owe')
    .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

  const totalOwedToUser = activeDebts
    .filter((debt: Debt) => debt.type === 'owed')
    .reduce((sum, debt) => sum + parseFloat(debt.amount), 0);

  const netBalance = totalOwedToUser - totalOwed;

  const handleSettleDebt = (id: string) => {
    updateDebtMutation.mutate({ id, updates: { settled: true } });
  };

  const handleRemindFriend = (debt: Debt) => {
    toast({
      title: "Reminder Sent",
      description: `Reminder sent to ${debt.friendName}`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">You Owe</p>
                <p className="text-2xl font-bold text-red-700" data-testid="total-owed">
                  {formatCurrency(totalOwed)}
                </p>
              </div>
              <ArrowUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Owed to You</p>
                <p className="text-2xl font-bold text-green-700" data-testid="total-owed-to-user">
                  {formatCurrency(totalOwedToUser)}
                </p>
              </div>
              <ArrowDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  netBalance >= 0 ? 'text-green-700' : 'text-red-700'
                }`} data-testid="net-balance">
                  {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                </p>
              </div>
              <Scale className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Debts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Debts & Loans</CardTitle>
            <Button
              onClick={() => setDebtModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-debt"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Debt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeDebts.length > 0 ? (
            <div className="space-y-4">
              {activeDebts.map((debt: Debt) => (
                <div key={debt.id} className="border rounded-lg p-6" data-testid={`debt-${debt.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-white">
                          {debt.friendName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{debt.friendName}</p>
                        <p className="text-sm text-gray-500">{debt.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(debt.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        debt.type === 'owe' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(debt.amount)}
                      </p>
                      <Badge variant={debt.type === 'owe' ? 'destructive' : 'default'}>
                        {debt.type === 'owe' ? 'You owe' : 'Owes you'}
                      </Badge>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSettleDebt(debt.id)}
                          disabled={updateDebtMutation.isPending}
                          data-testid={`button-settle-${debt.id}`}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Settle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemindFriend(debt)}
                          data-testid={`button-remind-${debt.id}`}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Remind
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDebtMutation.mutate(debt.id)}
                          disabled={deleteDebtMutation.isPending}
                          data-testid={`button-delete-${debt.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              No active debts. Add a debt record to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement History */}
      {settledDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settledDebts.map((debt: Debt) => (
                <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Settled with {debt.friendName}</p>
                      <p className="text-sm text-gray-500">{debt.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(debt.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(debt.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DebtModal open={debtModalOpen} onOpenChange={setDebtModalOpen} />
    </div>
  );
}
