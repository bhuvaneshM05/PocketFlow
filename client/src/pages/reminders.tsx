import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Calendar, Clock, CheckCircle, AlarmClockOff, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ReminderModal from "@/components/forms/reminder-modal";
import { type Reminder } from "@shared/schema";

export default function Reminders() {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const updateReminderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Reminder> }) => {
      return await apiRequest("PATCH", `/api/reminders/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder",
        variant: "destructive",
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  const pendingReminders = reminders.filter((r: Reminder) => r.status === 'pending');
  const paidReminders = reminders.filter((r: Reminder) => r.status === 'paid');
  const recurringReminders = reminders.filter((r: Reminder) => r.recurring);

  const handleMarkPaid = (id: string) => {
    updateReminderMutation.mutate({ 
      id, 
      updates: { status: 'paid' } 
    });
    toast({
      title: "Success",
      description: "Reminder marked as paid",
    });
  };

  const handleSnooze = (id: string) => {
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 1); // AlarmClockOff for 1 day
    
    updateReminderMutation.mutate({ 
      id, 
      updates: { 
        status: 'snoozed',
        dueDate: newDueDate 
      } 
    });
    toast({
      title: "Success",
      description: "Reminder snoozed for 1 day",
    });
  };

  const getDaysUntilDue = (dueDate: string | Date) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate: string | Date) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  };

  const getDueDateColor = (dueDate: string | Date) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return "text-red-600";
    if (days <= 1) return "text-orange-600";
    if (days <= 3) return "text-yellow-600";
    return "text-green-600";
  };

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
      {/* Add Reminder Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setReminderModalOpen(true)}
          className="bg-primary hover:bg-primary/90"
          data-testid="button-add-reminder"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReminders.length > 0 ? (
            <div className="space-y-4">
              {pendingReminders
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((reminder: Reminder) => (
                <div key={reminder.id} className="border rounded-lg p-6" data-testid={`reminder-${reminder.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mr-4">
                        <Calendar className="text-accent h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{reminder.title}</p>
                        {reminder.description && (
                          <p className="text-sm text-gray-500">{reminder.description}</p>
                        )}
                        <p className={`text-xs font-medium ${getDueDateColor(reminder.dueDate)}`}>
                          {formatDueDate(reminder.dueDate)} ({new Date(reminder.dueDate).toLocaleDateString('en-IN')})
                        </p>
                        {reminder.recurring && (
                          <Badge variant="secondary" className="mt-1">
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent">
                        {formatCurrency(reminder.amount)}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkPaid(reminder.id)}
                          disabled={updateReminderMutation.isPending}
                          data-testid={`button-mark-paid-${reminder.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSnooze(reminder.id)}
                          disabled={updateReminderMutation.isPending}
                          data-testid={`button-snooze-${reminder.id}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          AlarmClockOff
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          disabled={deleteReminderMutation.isPending}
                          data-testid={`button-delete-${reminder.id}`}
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
              No upcoming reminders. Add a reminder to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Reminders */}
      {recurringReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recurring Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recurringReminders.map((reminder: Reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Calendar className="text-blue-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-gray-500">
                        Every month • {formatCurrency(reminder.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={reminder.status !== 'snoozed'}
                      onCheckedChange={(checked) => {
                        updateReminderMutation.mutate({
                          id: reminder.id,
                          updates: { status: checked ? 'pending' : 'snoozed' }
                        });
                      }}
                      data-testid={`switch-recurring-${reminder.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paid Reminders */}
      {paidReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paidReminders.slice(0, 5).map((reminder: Reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{reminder.title}</p>
                      <p className="text-sm text-gray-500">
                        Paid on {new Date(reminder.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(reminder.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ReminderModal open={reminderModalOpen} onOpenChange={setReminderModalOpen} />
    </div>
  );
}
