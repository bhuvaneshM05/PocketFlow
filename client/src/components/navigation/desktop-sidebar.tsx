import { Button } from "@/components/ui/button";
import { Home, List, HandHeart, Bell, Bot } from "lucide-react";
import { Link, useLocation } from "wouter";

const DesktopSidebar = () => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", testId: "nav-dashboard" },
    { path: "/transactions", icon: List, label: "Transactions", testId: "nav-transactions" },
    { path: "/debts", icon: HandHeart, label: "Debts & Loans", testId: "nav-debts" },
    { path: "/reminders", icon: Bell, label: "Reminders", testId: "nav-reminders" },
    { path: "/chat", icon: Bot, label: "AI Assistant", testId: "nav-chat" },
  ];

  return (
    <div className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:shadow-lg md:border-r md:border-gray-200 md:flex md:flex-col z-40">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">ExpenseTracker</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ path, icon: Icon, label, testId }) => (
          <Link key={path} href={path}>
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                location === path
                  ? "text-primary bg-primary/10"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              data-testid={testId}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DesktopSidebar;
