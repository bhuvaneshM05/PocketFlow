import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Debts from "@/pages/debts";
import Reminders from "@/pages/reminders";
import Chat from "@/pages/chat";
import MobileNav from "@/components/navigation/mobile-nav";
import DesktopSidebar from "@/components/navigation/desktop-sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/debts" component={Debts} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/chat" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DesktopSidebar />
      <div className="md:ml-64 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ExpenseTracker</h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <i className="fas fa-search text-lg"></i>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout>
          <Router />
        </AppLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
