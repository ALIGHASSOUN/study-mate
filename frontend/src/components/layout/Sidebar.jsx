import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import {
  Home,
  Armchair,
  Package,
  FileText,
  Users,
  KeyRound,
  LogOut,
  Menu,
  X,
  Coffee,
  PieChart,
} from "lucide-react";

const Sidebar = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home, roles: ["admin", "cashier"] },
    {
      path: "/reservations",
      label: "Reservations",
      icon: Armchair,
      roles: ["admin", "cashier"],
    },
    {
      path: "/on-house",
      label: "On House",
      icon: Coffee,
      roles: ["admin", "cashier"],
    },
    {
      path: "/inventory",
      label: "Inventory",
      icon: Package,
      roles: ["admin"],
    },
    {
      path: "/invoices",
      label: "Invoices",
      icon: FileText,
      roles: ["admin"],
    },
    {
      path: "/on-house-all",
      label: "On-House (All)",
      icon: Coffee,
      roles: ["admin"],
    },
    {
      path: "/on-house-by-user",
      label: "On-House / Staff",
      icon: PieChart,
      roles: ["admin"],
    },
    {
      path: "/cashier-sessions",
      label: "Sessions",
      icon: KeyRound,
      roles: ["admin"],
    },
    { path: "/users", label: "Users", icon: Users, roles: ["admin"] },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-cafe-mid">
        <h2 className="text-lg font-bold text-cafe-teal">Study Cafe</h2>
        <p className="text-xs text-cafe-light mt-1">
          {user?.username || user?.role} ({user?.role})
        </p>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-cafe-teal/20 text-cafe-teal font-semibold"
                  : "text-cafe-light hover:bg-cafe-mid/30 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-cafe-mid">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cafe-dark flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 bg-cafe-deep border-r border-cafe-mid flex-col fixed inset-y-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-cafe-deep p-2 rounded-lg border border-cafe-mid"
      >
        <Menu size={20} className="text-cafe-light" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-cafe-deep border-r border-cafe-mid z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4"
            >
              <X size={20} className="text-cafe-light" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-56">{children}</main>
    </div>
  );
};

export default Sidebar;
