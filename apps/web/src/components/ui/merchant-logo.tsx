import {
  ShoppingCart,
  Coffee,
  Home,
  Briefcase,
  Car,
  Gamepad2,
  Heart,
  Plane,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MerchantLogoProps {
  merchantName: string;
  category?: string;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactElement> = {
    "Food & Dining": <Coffee className="h-4 w-4" />,
    Shopping: <ShoppingCart className="h-4 w-4" />,
    Housing: <Home className="h-4 w-4" />,
    Income: <Briefcase className="h-4 w-4" />,
    Transportation: <Car className="h-4 w-4" />,
    Entertainment: <Gamepad2 className="h-4 w-4" />,
    Healthcare: <Heart className="h-4 w-4" />,
    Travel: <Plane className="h-4 w-4" />,
    Business: <Building className="h-4 w-4" />,
  };
  return iconMap[category] || <Building className="h-4 w-4" />;
};

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    "Food & Dining": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Shopping: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Housing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Income: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Transportation: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Entertainment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    Healthcare: "bg-red-500/20 text-red-400 border-red-500/30",
    Travel: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    Business: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    colorMap[category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  );
};

export function MerchantLogo({
  merchantName,
  category,
  className,
}: MerchantLogoProps) {
  if (category) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
          getCategoryColor(category),
          className
        )}
      >
        {getCategoryIcon(category)}
      </div>
    );
  }

  // Fallback to first letter avatar
  const firstLetter = merchantName?.charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-muted/20 text-muted-foreground border border-border/50 text-sm font-medium",
        className
      )}
    >
      {firstLetter}
    </div>
  );
}
