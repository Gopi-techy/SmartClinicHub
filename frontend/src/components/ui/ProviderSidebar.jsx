import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const ProviderSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/doctor-dashboard',
      isActive: location.pathname === '/doctor-dashboard'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: 'Calendar',
      path: '/appointment-booking',
      isActive: location.pathname === '/appointment-booking'
    },
    {
      id: 'patients',
      label: 'Patient Records',
      icon: 'Users',
      path: '/health-records-management',
      isActive: location.pathname === '/health-records-management'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'MessageCircle',
      path: '/messages',
      isActive: location.pathname === '/messages'
    }
  ];

  return (
    <aside className={`fixed left-0 top-16 bottom-0 bg-background border-r border-border transition-all duration-300 z-30 hidden md:block ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Collapse Toggle */}
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            iconName={isCollapsed ? 'ChevronRight' : 'ChevronLeft'}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                item.isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={item.icon} size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name={user?.role === 'doctor' ? 'Stethoscope' : 'User'} className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {user ? (
                    user.role === 'doctor' 
                      ? 'Medical Professional' 
                      : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
                  ) : 'Provider'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.role === 'doctor' 
                    ? `${user?.department || 'Internal Medicine'} • ${user?.specialization || 'General Medicine'}`
                    : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Provider')
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ProviderSidebar;