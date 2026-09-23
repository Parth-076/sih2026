import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ScanLine, History, Package, ShieldQuestion, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import { Role } from "../types/auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inspections/new", label: "New Inspection", icon: ScanLine },
  { to: "/history", label: "Inspection History", icon: History },
  { to: "/products", label: "Product Repository", icon: Package },
  { to: "/rules", label: "Rules Management", icon: ShieldQuestion, roles: ["ADMIN"] },
  { to: "/users", label: "User Management", icon: Users, roles: ["ADMIN"] },
];

export default function AppShell() {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-navy-900 text-white">
        <div className="flex items-center gap-2 border-b border-navy-700 px-5 py-4">
          <img src={logo} alt="LabelCheck" className="h-8 w-8 rounded bg-white p-1" />
          <div>
            <p className="text-sm font-semibold leading-tight">LabelCheck</p>
            <p className="text-[11px] text-navy-300">Digital Inspector</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : "text-navy-200 hover:bg-navy-800 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-navy-700 px-4 py-3">
          <p className="truncate text-xs text-navy-300">{user?.email}</p>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-teal-400">{user?.role}</p>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-navy-200 transition hover:bg-navy-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
