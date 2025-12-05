import {
  BarChart3,
  FileText,
  Inbox,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "RFPs", href: "/rfps", icon: FileText },
  { name: "Vendors", href: "/vendors", icon: Users },
  { name: "Proposals", href: "/proposals", icon: Inbox },
  { name: "Compare", href: "/compare", icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card shadow-lg">
      <div className="flex h-14 items-center border-b border-border px-4">
        <h1 className="text-base font-medium text-foreground">RFP Manager</h1>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navigation.map((item) => {
          // For root route, use exact match
          // For other routes, check if pathname starts with the href (parent route matching)
          const isActive =
            item.href === "/" ?
              location.pathname === item.href
            : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-normal transition-colors",
                isActive ?
                  "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon
                className={cn("h-4 w-4", isActive && "text-primary-foreground")}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
