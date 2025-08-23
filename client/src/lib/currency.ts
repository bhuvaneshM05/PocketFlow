export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(/[₹,\s]/g, ''));
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    food: 'bg-red-500',
    transport: 'bg-blue-500',
    entertainment: 'bg-green-500',
    study: 'bg-purple-500',
    mess: 'bg-yellow-500',
    other: 'bg-gray-500',
  };
  return colors[category] || 'bg-gray-500';
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    food: 'fas fa-utensils',
    transport: 'fas fa-bus',
    entertainment: 'fas fa-gamepad',
    study: 'fas fa-book',
    mess: 'fas fa-home',
    other: 'fas fa-shopping-bag',
  };
  return icons[category] || 'fas fa-shopping-bag';
};

export const getTransactionTypeColor = (type: string, amount: number): string => {
  if (type === 'income' || amount > 0) return 'text-green-600';
  return 'text-red-600';
};

export const formatTransactionAmount = (type: string, amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const prefix = type === 'expense' ? '-' : '+';
  return `${prefix}${formatCurrency(numAmount)}`;
};
