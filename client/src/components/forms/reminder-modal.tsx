import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertReminderSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertReminderSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReminderModal({ open, onOpenChange }: ReminderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      dueDate: "",
      recurring: false,
      status: "pending",
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount).toFixed(2),
        dueDate: new Date(data.dueDate),
      };
      return await apiRequest("POST", "/api/reminders", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reminder created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createReminderMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="reminder-modal-title">Set Reminder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Mess Fees Payment"
                      data-testid="input-title"
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more details..."
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      data-testid="input-due-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-recurring"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring reminder</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Set this as a recurring monthly reminder
                    </p>
                  </div>
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
                disabled={createReminderMutation.isPending}
                data-testid="button-submit"
              >
                {createReminderMutation.isPending ? "Creating..." : "Set Reminder"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
