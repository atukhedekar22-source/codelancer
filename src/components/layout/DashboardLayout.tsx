import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'developer' | 'freelancer' | 'admin';
  disablePadding?: boolean;
}

const developerLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/developer' },
  { icon: FolderOpen, label: 'My Projects', path: '/developer/projects' },
  { icon: Users, label: 'Find Freelancers', path: '/developer/freelancers' },
  { icon: Briefcase, label: 'Applied Projects', path: '/developer/applied-projects' },
  { icon: MessageSquare, label: 'Messages', path: '/developer/messages' },
  { icon: Wallet, label: 'Payments', path: '/developer/payments' },
  { icon: Settings, label: 'Settings', path: '/developer/settings' },
];

const freelancerLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/freelancer' },
  { icon: Briefcase, label: 'My Projects', path: '/freelancer/my-projects' },
  { icon: FolderOpen, label: 'Browse Projects', path: '/freelancer/projects' },
  { icon: Users, label: 'My Bids', path: '/freelancer/bids' },
  { icon: MessageSquare, label: 'Messages', path: '/freelancer/messages' },
  { icon: Wallet, label: 'Earnings', path: '/freelancer/earnings' },
  { icon: Settings, label: 'Settings', path: '/freelancer/settings' },
];

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: FolderOpen, label: 'Projects', path: '/admin/projects' },
  { icon: MessageSquare, label: 'Disputes', path: '/admin/disputes' },
  { icon: Wallet, label: 'Revenue', path: '/admin/revenue' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role, disablePadding = false }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const links = role === 'admin' ? adminLinks : role === 'developer' ? developerLinks : freelancerLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className="fixed left-0 top-0 bottom-0 bg-card border-r border-border z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">C</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Code<span className="gradient-text">Lancer</span>
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all',
              collapsed && 'justify-center'
            )}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {!collapsed && <span className="font-medium">Toggle Theme</span>}
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all',
              collapsed && 'justify-center'
            )}
          >
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold text-sm">
              {userProfile?.fullName?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{userProfile?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card shadow-md"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-20' : 'ml-[280px]'
        )}
      >
        <div className={cn("min-h-screen", !disablePadding && "p-6 lg:p-8")}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
