import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Settings,
  BarChart3,
  GitBranch,
  Mail,
  Server,
  Building2,
  Home,
  Sparkles,
  Shield,
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: Home,
      description: "Welcome to SAP CI/CD Automation Hub",
    },
    {
      to: "/pipeline",
      label: "CI/CD Pipeline",
      icon: GitBranch,
      description: "Automate SAP Integration Suite deployments",
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Monitor pipeline status and metrics",
    },
    {
      to: "/environments",
      label: "Environments",
      icon: Server,
      description: "Manage system connections and credentials",
    },
    {
      to: "/administration",
      label: "Administration",
      icon: Shield,
      description: "Register SAP Integration Suite tenants",
    },
    {
      to: "/contact",
      label: "Contact Us",
      icon: Mail,
      description: "Get support and assistance",
    },
  ];

  return (
    <header className="relative border-b bg-white/95 backdrop-blur-md shadow-lg shadow-blue-500/5">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50"></div>
      <div className="relative container mx-auto px-4">
        {/* Header Brand */}
        <div className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                <Building2 className="w-7 h-7" />
              </div>
            </div>
            <div className="group-hover:translate-x-1 transition-transform duration-300">
              <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                SAP CI/CD Automation
              </h1>
              <p className="text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-600 to-blue-600 bg-clip-text text-transparent">
                Integration Suite Pipeline Management
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex justify-end space-x-1 -mb-px overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (location.pathname === "/" && item.to === "/") ||
              (location.pathname === "/dashboard" &&
                item.to === "/dashboard" &&
                location.pathname !== "/");

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center space-x-3 px-6 py-4 text-sm font-semibold border-b-3 transition-all duration-300 group whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600 bg-gradient-to-t from-blue-50 to-transparent"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gradient-to-t hover:from-gray-50 hover:to-transparent",
                )}
                title={item.description}
              >
                {/* Animated background */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-t-lg transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-t from-blue-100/50 to-blue-50/30"
                      : "bg-transparent group-hover:bg-gradient-to-t group-hover:from-gray-100/50 group-hover:to-gray-50/30",
                  )}
                ></div>

                {/* Icon with glow effect */}
                <div className="relative">
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm"></div>
                  )}
                  <Icon
                    className={cn(
                      "relative w-5 h-5 transition-all duration-300",
                      isActive
                        ? "text-blue-600 scale-110"
                        : "text-gray-500 group-hover:text-gray-700 group-hover:scale-105",
                    )}
                  />
                </div>

                {/* Text with gradient effect */}
                <span
                  className={cn(
                    "relative transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-bold"
                      : "group-hover:translate-x-0.5",
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                  </div>
                )}

                {/* Sparkle animation for active tab */}
                {isActive && (
                  <Sparkles className="absolute top-1 right-1 w-3 h-3 text-blue-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom gradient border */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
    </header>
  );
};

export default Navigation;
