import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    // Get user's financial data for context
    const accounts = await storage.getAccounts();
    const transactions = await storage.getTransactions();
    const debts = await storage.getDebts();
    const reminders = await storage.getReminders();

    // Calculate spending insights
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const thisMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    const monthlySpent = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categorySpending = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const totalOwed = debts
      .filter(d => d.type === 'owe' && !d.settled)
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const totalOwedToUser = debts
      .filter(d => d.type === 'owed' && !d.settled)
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const upcomingReminders = reminders
      .filter(r => r.status === 'pending')
      .slice(0, 3);

    const systemPrompt = `You are ExpenseBot, a helpful AI assistant for a college student's expense tracking app. You have access to the user's financial data and can help with:

1. Adding expenses and income
2. Providing spending insights and analytics  
3. Tracking debts and loans with friends
4. Setting up reminders for bills and payments
5. Answering questions about spending patterns

Current Financial Context:
- Total Balance: ₹${totalBalance.toFixed(2)}
- This Month Spent: ₹${monthlySpent.toFixed(2)}  
- Category Spending: ${Object.entries(categorySpending).map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`).join(', ')}
- Total Owed by User: ₹${totalOwed.toFixed(2)}
- Total Owed to User: ₹${totalOwedToUser.toFixed(2)}

Always format currency in Indian Rupees (₹). Be conversational, helpful, and provide actionable insights. If the user wants to add an expense or perform an action, respond with the appropriate JSON command format.

For expense additions, respond with: {"action": "add_expense", "amount": number, "description": string, "category": string, "account": string}
For insights, provide helpful analysis with specific numbers and recommendations.`;

    const prompt = `${systemPrompt}

User Message: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't process that request. Please try again.";

  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm experiencing technical difficulties right now. Please try again in a moment.";
  }
}

export async function generateSpendingInsights(): Promise<{
  insights: string[];
  recommendations: string[];
  monthlyTrend: string;
}> {
  try {
    const transactions = await storage.getTransactions();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const thisMonthSpent = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const lastMonthSpent = lastMonthTransactions
      .filter(t => t.type === 'expense') 
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const prompt = `Analyze this college student's spending data and provide insights:

This Month Spent: ₹${thisMonthSpent.toFixed(2)}
Last Month Spent: ₹${lastMonthSpent.toFixed(2)}
Recent Transactions: ${monthlyTransactions.slice(0, 10).map(t => `${t.description}: ₹${t.amount} (${t.category})`).join(', ')}

Provide a JSON response with:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"], 
  "monthlyTrend": "trend analysis"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            insights: { 
              type: "array",
              items: { type: "string" }
            },
            recommendations: { 
              type: "array",
              items: { type: "string" }
            },
            monthlyTrend: { type: "string" },
          },
          required: ["insights", "recommendations", "monthlyTrend"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;

    if (rawJson) {
      const result = JSON.parse(rawJson);
      return {
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        monthlyTrend: result.monthlyTrend || "No trend data available"
      };
    } else {
      throw new Error("Empty response from model");
    }

  } catch (error) {
    console.error('Insights generation error:', error);
    return {
      insights: ["Unable to generate insights at this time"],
      recommendations: ["Please try again later"],
      monthlyTrend: "Trend analysis unavailable"
    };
  }
}