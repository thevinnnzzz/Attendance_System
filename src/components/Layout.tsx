import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users as UsersIcon, CheckSquare, FileBarChart, Settings, LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: UsersIcon },
    { name: 'Attendance', path: '/attendance', icon: CheckSquare },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    ...(user?.role === 'admin' ? [{ name: 'User Management', path: '/users', icon: Settings }] : [])
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-500">EduTrack</h1>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block text-sm text-muted-foreground font-medium">
              Welcome back, <span className="text-foreground">{user?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-red-600 dark:hover:text-red-500">
              <LogOut className="w-4 h-4 mr-2 hidden sm:block" />
              Sign Out
            </Button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
