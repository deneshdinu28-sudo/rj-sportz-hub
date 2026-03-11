import { LayoutDashboard, Building2, CreditCard, Settings, LogOut, ClipboardList, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Communities", url: "/communities", icon: Building2 },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Attendance", url: "/attendance", icon: ClipboardList },
  { title: "Coaches", url: "/coaches", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 border-b border-border mb-2">
          <Zap className="h-7 w-7 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
              RJ <span className="text-primary neon-text">SPORTZ</span>
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium neon-glow"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate mb-2 px-2">{user.email}</p>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          {!collapsed && "Logout"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
