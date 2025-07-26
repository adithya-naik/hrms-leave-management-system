import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  Home,
  Settings,
  Users,
  BarChart3,
  User,
  LogOut,
  Building2
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-toastify";

const employeeItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Leaves", url: "/leaves", icon: FileText },
  { title: "Apply Leave", url: "/leaves/new", icon: Clock },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Profile", url: "/profile", icon: User },
];

const managerItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Leaves", url: "/leaves", icon: FileText },
  { title: "Apply Leave", url: "/leaves/new", icon: Clock },
  { title: "Team Leaves", url: "/team-leaves", icon: Users },
  { title: "Approvals", url: "/approvals", icon: BarChart3 },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Profile", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Leaves", url: "/leaves", icon: FileText },
  { title: "Apply Leave", url: "/leaves/new", icon: Clock },
  { title: "All Leaves", url: "/admin/leaves", icon: FileText },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const getMenuItems = () => {
    if (user?.role === 'ADMIN') return adminItems;
    if (user?.role === 'MANAGER') return managerItems;
    return employeeItems;
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">
                  LeaveStride
                </h1>
                <p className="text-sm text-sidebar-foreground/70">
                  Leave Management
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!collapsed && "Main Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar">
        <div className="p-4">
          {!collapsed && user && (
            <div className="mb-3">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {user.role} • {user.department}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}