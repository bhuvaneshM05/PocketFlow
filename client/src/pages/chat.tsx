import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, User, Send, Paperclip, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type ChatMessage } from "@shared/schema";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 2000, // Poll for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsTyping(true);
      return await apiRequest("POST", "/api/chat/messages", {
        content,
        isUser: true,
      });
    },
    onSuccess: () => {
      setMessage("");
      // Refetch messages to get AI response
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
        setIsTyping(false);
      }, 1000);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/chat/messages");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chat history cleared",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear chat history",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleQuickMessage = (quickMessage: string) => {
    setMessage(quickMessage);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat with welcome message if empty
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      sendMessageMutation.mutate("Hello! I'm ready to help with my expenses.");
    }
  }, [messages.length, isLoading]);

  const quickMessages = [
    "Show my spending trends",
    "Add ₹50 canteen expense", 
    "Remind me about mess fees",
    "What's my monthly budget status?",
    "Show debts with friends",
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] p-4">
        <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Chat Header */}
      <Card className="rounded-b-none">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ExpenseBot</h3>
                <p className="text-sm text-green-600">● Online - Ready to help!</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearChatMutation.mutate()}
              disabled={clearChatMutation.isPending}
              data-testid="button-clear-chat"
            >
              Clear Chat
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 border-x">
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex items-start ${msg.isUser ? "justify-end" : ""}`}
            data-testid={`message-${msg.id}`}
          >
            {!msg.isUser && (
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${
                msg.isUser
                  ? "bg-primary text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <span
                className={`text-xs mt-1 block ${
                  msg.isUser ? "text-blue-200" : "text-gray-500"
                }`}
              >
                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            {msg.isUser && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-3">
                <User className="h-4 w-4 text-gray-700" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mr-3">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <Card className="rounded-t-none">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" type="button">
                <Paperclip className="h-4 w-4 text-gray-400" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about your expenses..."
                  className="pr-12"
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <Mic className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !message.trim()}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Messages */}
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((quickMsg) => (
                <Button
                  key={quickMsg}
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={() => handleQuickMessage(quickMsg)}
                  data-testid={`quick-message-${quickMsg.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
