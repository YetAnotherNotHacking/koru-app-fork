import { getTransactions, type TransactionReadWithOpposing } from "api-client";
import { getRequestConfig } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Wallet,
  TrendingUp,
} from "lucide-react";

// We need to prevent static generation, since the API is not available at build time
export const dynamic = "force-dynamic";

// Dummy data for accounts (keeping for now until we add accounts API)
const dummyAccounts = [
  {
    id: "1",
    name: "Main Checking",
    type: "CACC",
    balance: 4250.67,
    currency: "EUR",
    iban: "GL06 5770 0000 0577 07",
  },
  {
    id: "2",
    name: "Savings Account",
    type: "SVGS",
    balance: 12850.0,
    currency: "EUR",
    iban: "GL08 7568 0000 0756 87",
  },
  {
    id: "3",
    name: "Credit Card",
    type: "CARD",
    balance: -342.15,
    currency: "EUR",
    iban: "GL08 7568 0000 0756 87",
  },
];

// Enhanced transaction type with enriched data
interface EnrichedTransaction {
  id: string;
  amount: number;
  currency: string;
  opposing_name: string;
  description: string;
  booking_time: string;
  category: string;
  account_name: string;
  merchant_type: "income" | "expense";
}

// Function to enrich transaction data with categories and better descriptions
function enrichTransactionData(
  transactions: TransactionReadWithOpposing[]
): EnrichedTransaction[] {
  // Merchant name mappings for better display names
  const merchantMappings: Record<
    string,
    { name: string; category: string; description: string }
  > = {
    // Common patterns for merchant recognition
    supermarket: {
      name: "Supermarket XYZ",
      category: "Food & Dining",
      description: "Weekly groceries",
    },
    coffee: {
      name: "Coffee Corner",
      category: "Food & Dining",
      description: "Morning coffee",
    },
    restaurant: {
      name: "Fine Dining",
      category: "Food & Dining",
      description: "Dinner out",
    },
    gas: {
      name: "Gas Station",
      category: "Transportation",
      description: "Fuel",
    },
    amazon: {
      name: "Amazon",
      category: "Shopping",
      description: "Online purchase",
    },
    netflix: {
      name: "Netflix",
      category: "Entertainment",
      description: "Streaming subscription",
    },
    spotify: {
      name: "Spotify",
      category: "Entertainment",
      description: "Music subscription",
    },
    rent: {
      name: "Property Management",
      category: "Housing",
      description: "Monthly rent",
    },
    salary: {
      name: "Employer Corp",
      category: "Income",
      description: "Monthly salary",
    },
    transfer: {
      name: "Bank Transfer",
      category: "Income",
      description: "Transfer received",
    },
    tech: {
      name: "Tech Store",
      category: "Shopping",
      description: "Electronics purchase",
    },
    gym: {
      name: "Fitness Center",
      category: "Healthcare",
      description: "Gym membership",
    },
    pharmacy: {
      name: "Local Pharmacy",
      category: "Healthcare",
      description: "Medication",
    },
    uber: {
      name: "Uber",
      category: "Transportation",
      description: "Ride sharing",
    },
    hotel: {
      name: "Hotel Chain",
      category: "Travel",
      description: "Accommodation",
    },
  };

  // Category assignment based on amount patterns and merchant names
  const categorizeTransaction = (
    opposing_name: string | null,
    amount: number
  ): { category: string; description: string; displayName: string } => {
    const name = (opposing_name || "").toLowerCase();

    // Check for known merchants
    for (const [key, value] of Object.entries(merchantMappings)) {
      if (name.includes(key)) {
        return {
          category: value.category,
          description: value.description,
          displayName: value.name,
        };
      }
    }

    // Pattern-based categorization
    if (amount > 0) {
      if (amount > 1000) {
        return {
          category: "Income",
          description: "Monthly salary",
          displayName: opposing_name || "Salary Payment",
        };
      } else {
        return {
          category: "Income",
          description: "Transfer received",
          displayName: opposing_name || "Transfer",
        };
      }
    } else {
      const absAmount = Math.abs(amount);
      if (absAmount > 800) {
        return {
          category: "Housing",
          description: "Monthly rent",
          displayName: opposing_name || "Rent Payment",
        };
      } else {
        if (Math.random() > 0.5) {
          return {
            category: "Shopping",
            description: "Purchase",
            displayName: opposing_name || "Store Purchase",
          };
        } else {
          return {
            category: "Food & Dining",
            description: "Dining out",
            displayName: opposing_name || "Restaurant",
          };
        }
      }
    }
  };

  return transactions.map((transaction, index) => {
    const { category, description, displayName } = categorizeTransaction(
      transaction.opposing_name ?? null,
      transaction.amount
    );

    return {
      id: transaction.id || index.toString(),
      amount: transaction.amount,
      currency: transaction.currency || "EUR",
      opposing_name: displayName,
      description: description,
      booking_time: transaction.booking_time,
      category: category,
      account_name: "Main Account", // We'll improve this when we integrate accounts API
      merchant_type: transaction.amount >= 0 ? "income" : "expense",
    };
  });
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAccountIcon = (type: string) => {
  switch (type) {
    case "CACC":
      return <Wallet className="h-5 w-5" />;
    case "SVGS":
      return <PiggyBank className="h-5 w-5" />;
    case "CARD":
      return <CreditCard className="h-5 w-5" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
};

export default async function Dashboard() {
  const config = await getRequestConfig();

  // Fetch real data from API
  const transactionsResult = await getTransactions({
    ...config,
    query: { limit: 5 },
  });

  // Enrich transaction data with categories and better descriptions
  const enrichedTransactions = transactionsResult.data
    ? enrichTransactionData(transactionsResult.data)
    : [];

  // Calculate metrics from real data
  const totalBalance = dummyAccounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );

  const monthlyIncome = enrichedTransactions
    .filter(
      (t) =>
        t.amount > 0 &&
        new Date(t.booking_time).getMonth() === new Date().getMonth()
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = Math.abs(
    enrichedTransactions
      .filter(
        (t) =>
          t.amount < 0 &&
          new Date(t.booking_time).getMonth() === new Date().getMonth()
      )
      .reduce((sum, t) => sum + t.amount, 0)
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-background/95 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-sky-500/10 to-blue-600/10 border-sky-500/40 md:py-6 py-4 gap-2 md:gap-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 md:px-6">
              <CardTitle className="text-sm font-medium text-sky-300">
                Total Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-sky-400" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {formatCurrency(totalBalance, "EUR")}
              </div>
              <p className="text-xs text-sky-300/80 mt-1">
                Across {dummyAccounts.length} accounts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 border-emerald-500/40 md:py-6 py-4 gap-2 md:gap-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 md:px-6">
              <CardTitle className="text-sm font-medium text-emerald-300">
                Monthly Income
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {formatCurrency(monthlyIncome, "EUR")}
              </div>
              <p className="text-xs text-emerald-300/80 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-rose-600/10 border-red-500/40 md:py-6 py-4 gap-2 md:gap-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4 md:px-6">
              <CardTitle className="text-sm font-medium text-red-300">
                Monthly Expenses
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-white">
                {formatCurrency(monthlyExpenses, "EUR")}
              </div>
              <p className="text-xs text-red-300/80 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accounts */}
          <Card className="lg:col-span-1 gap-2 md:gap-4">
            <CardHeader>
              <CardTitle className="text-white">Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dummyAccounts.map((account) => (
                <div
                  key={account.id}
                  className="group p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between space-y-3 xl:space-y-0">
                    {/* Left side: Icon, name, and type */}
                    <div className="flex items-center space-x-3 min-w-0 xl:flex-1">
                      <div className="p-2 rounded-full bg-muted/20 group-hover:bg-muted/30 transition-colors">
                        {getAccountIcon(account.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {account.type === "CACC"
                            ? "Checking"
                            : account.type === "SVGS"
                              ? "Savings"
                              : account.type === "CARD"
                                ? "Credit"
                                : "Account"}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Amount */}
                    <div className="xl:text-right xl:ml-4 xl:flex-shrink-0">
                      <p
                        className={`text-lg font-semibold whitespace-nowrap ${
                          account.balance >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>
                  </div>

                  {/* IBAN - always at bottom */}
                  <div className="xl:mt-2">
                    <p className="text-xs text-muted-foreground/60 truncate">
                      {account.iban}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">
                Recent Transactions
                {transactionsResult.error && (
                  <span className="text-sm text-red-400 ml-2">
                    (Error loading)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrichedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {transactionsResult.error
                    ? "Error loading transactions. Try refreshing the page."
                    : "No transactions found. Connect your bank account to see transactions."}
                </div>
              ) : (
                <div className="space-y-3">
                  {enrichedTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 rounded-lg bg-card/30 border border-border/30 hover:bg-card/60 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        {/* Left side: Logo and transaction details */}
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="relative">
                            <MerchantLogo
                              merchantName={transaction.opposing_name}
                              category={transaction.category}
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center ${
                                transaction.amount >= 0
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            >
                              {transaction.amount >= 0 ? (
                                <ArrowUpRight className="h-3 w-3 text-white" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">
                              {transaction.opposing_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              {transaction.account_name} •{" "}
                              {formatDate(transaction.booking_time)}
                            </p>
                          </div>
                        </div>

                        {/* Right side: Amount and category */}
                        <div>
                          <p
                            className={`font-semibold text-lg whitespace-nowrap ${
                              transaction.amount >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {formatCurrency(
                              transaction.amount,
                              transaction.currency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
