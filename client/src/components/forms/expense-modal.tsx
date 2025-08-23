import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTransactionSchema, type Account } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTransactionSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: "expense" | "income";
}

export default function ExpenseModal({ open, onOpenChange, type = "expense" }: ExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type,
      amount: "",
      description: "",
      category: "other",
      accountId: "",
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      };
      return await apiRequest("POST", "/api/transactions", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${type === "expense" ? "Expense" : "Income"} added successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to add ${type}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createTransactionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="expense-modal-title">
            Add {type === "expense" ? "Expense" : "Income"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount"
                      type="number"
                      step="0.01"
                      min="0"
                      data-testid="input-amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`What did you ${type === "expense" ? "spend on" : "earn from"}?`}
                      data-testid="input-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="study">Study Materials</SelectItem>
                      <SelectItem value="mess">Mess</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account: Account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTransactionMutation.isPending}
                data-testid="button-submit"
              >
                {createTransactionMutation.isPending
                  ? "Adding..."
                  : `Add ${type === "expense" ? "Expense" : "Income"}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
