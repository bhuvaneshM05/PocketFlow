import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDebtSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDebtSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

interface DebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DebtModal({ open, onOpenChange }: DebtModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      friendName: "",
      type: "owe",
      amount: "",
      description: "",
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
      };
      return await apiRequest("POST", "/api/debts", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Debt record added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add debt record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createDebtMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="debt-modal-title">Track Debt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="friendName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter friend's name"
                      data-testid="input-friend-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-debt-type">
                        <SelectValue placeholder="Select debt type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owe">I owe them</SelectItem>
                      <SelectItem value="owed">They owe me</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      data-testid="input-debt-amount"
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
                      placeholder="What was this for?"
                      data-testid="input-debt-description"
                      {...field}
                    />
                  </FormControl>
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
                disabled={createDebtMutation.isPending}
                data-testid="button-submit"
              >
                {createDebtMutation.isPending ? "Adding..." : "Add Debt"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
