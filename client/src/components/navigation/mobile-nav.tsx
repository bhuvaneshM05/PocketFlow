import { Button } from "@/components/ui/button";
import { Home, List, HandHeart, Bell, Bot } from "lucide-react";
import { Link, useLocation } from "wouter";

const MobileNav = () => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home", testId: "nav-home" },
    { path: "/transactions", icon: List, label: "Transactions", testId: "nav-transactions" },
    { path: "/debts", icon: HandHeart, label: "Debts", testId: "nav-debts" },
    { path: "/reminders", icon: Bell, label: "Reminders", testId: "nav-reminders" },
    { path: "/chat", icon: Bot, label: "AI Chat", testId: "nav-chat" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around py-2">
        {navItems.map(({ path, icon: Icon, label, testId }) => (
          <Link key={path} href={path}>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center py-2 px-4 h-auto ${
                location === path 
                  ? "text-primary" 
                  : "text-gray-400"
              }`}
              data-testid={testId}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
