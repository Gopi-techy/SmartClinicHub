import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const RoleBasedHeader = () => {
  const navigate = useNavigate();
  const { user, logout, userRole } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login-registration');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient':
        return 'Patient Portal';
      case 'doctor':
        return 'Doctor Dashboard';
      case 'admin':
        return 'Admin Panel';
      case 'nurse':
        return 'Nurse Interface';
      default:
        return 'Healthcare Portal';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'patient':
        return 'text-blue-600';
      case 'doctor':
        return 'text-green-600';
      case 'admin':
        return 'text-purple-600';
      case 'nurse':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'patient':
        return 'User';
      case 'doctor':
        return 'Stethoscope';
      case 'admin':
        return 'Settings';
      case 'nurse':
        return 'Heart';
      default:
        return 'User';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Heart" size={20} className="text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SmartClinicHub</span>
            </div>
            
            {/* Role Badge */}
            <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-muted ${getRoleColor(userRole)}`}>
              <Icon name={getRoleIcon(userRole)} size={16} />
              <span className="text-sm font-medium">{getRoleDisplayName(userRole)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/${userRole}-dashboard`)}
            >
              Dashboard
            </Button>
            
            {userRole === 'patient' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/appointment-booking')}
                >
                  Book Appointment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/health-records-management')}
                >
                  Health Records
                </Button>
              </>
            )}
            
            {userRole === 'doctor' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/appointment-booking')}
                >
                  Manage Appointments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/health-records-management')}
                >
                  Patient Records
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
            >
              Messages
            </Button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
            >
              <Icon name="Bell" size={20} />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="User" size={16} className="text-primary-foreground" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.firstName || 'User'}
                </span>
                <Icon name="ChevronDown" size={16} />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <Icon name="User" size={16} className="mr-2" />
                    Profile
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Icon name="Settings" size={16} className="mr-2" />
                    Settings
                  </Button>
                  
                  <div className="border-t border-border my-1"></div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-destructive hover:text-destructive"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${getRoleColor(userRole)}`}>
              {getRoleDisplayName(userRole)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
            >
              <Icon name="MessageCircle" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoleBasedHeader;