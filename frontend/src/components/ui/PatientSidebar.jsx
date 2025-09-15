import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const PatientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'Home',
      path: '/patient-dashboard',
      isActive: location.pathname === '/patient-dashboard'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'User',
      path: '/profile',
      isActive: location.pathname === '/profile'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: 'Calendar',
      path: '/appointment-booking',
      isActive: location.pathname === '/appointment-booking'
    },
    {
      id: 'records',
      label: 'Health Records',
      icon: 'FileText',
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

  // Fetch dashboard data when component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/patient-dashboard/overview', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDashboardData(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Calculate health score based on real data
  const getHealthScore = () => {
    if (!dashboardData?.overview) return { score: null, status: 'Unknown' };
    
    const { overview } = dashboardData;
    let score = 100;
    
    // Adjust score based on real data
    if (overview.healthScore !== null && overview.healthScore !== undefined) {
      return {
        score: overview.healthScore,
        status: overview.healthScore >= 80 ? 'Excellent' : 
                overview.healthScore >= 60 ? 'Good' : 
                overview.healthScore >= 40 ? 'Fair' : 'Needs Attention'
      };
    }
    
    // Fallback calculation if no health score is available
    if (overview.upcomingAppointments === 0) score -= 10;
    if (overview.activePrescriptions > 3) score -= 15;
    if (overview.unreadNotifications > 5) score -= 10;
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      status: score >= 80 ? 'Excellent' : 
              score >= 60 ? 'Good' : 
              score >= 40 ? 'Fair' : 'Needs Attention'
    };
  };

  // Get next appointment info
  const getNextAppointment = () => {
    if (dashboardData?.upcomingAppointments?.length > 0) {
      const appointment = dashboardData.upcomingAppointments[0];
      const date = new Date(appointment.appointmentDate);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: appointment.startTime || appointment.time || 'TBD',
        doctor: appointment.doctor ? `Dr. ${appointment.doctor.lastName}` : 'Doctor'
      };
    }
    return null;
  };

  const healthScore = getHealthScore();
  const nextAppointment = getNextAppointment();

  return (
    <aside className={`fixed left-0 top-16 bottom-0 bg-background border-r border-border transition-all duration-300 z-30 hidden md:block ${
      isCollapsed ? 'w-16' : 'w-64'
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

        {/* Health Information Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-border space-y-4">
            {/* Health Score */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                healthScore.score >= 80 ? 'bg-emerald-100' : 
                healthScore.score >= 60 ? 'bg-blue-100' : 
                healthScore.score >= 40 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Icon 
                  name="Heart" 
                  className={`w-5 h-5 ${
                    healthScore.score >= 80 ? 'text-emerald-600' : 
                    healthScore.score >= 60 ? 'text-blue-600' : 
                    healthScore.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`} 
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Health Score</p>
                {loading ? (
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                ) : healthScore.score !== null ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          healthScore.score >= 80 ? 'bg-emerald-500' : 
                          healthScore.score >= 60 ? 'bg-blue-500' : 
                          healthScore.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${healthScore.score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{healthScore.score}%</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </div>
            </div>

            {/* Next Appointment */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Calendar" className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Next Appointment</p>
                {loading ? (
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                ) : nextAppointment ? (
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.date} at {nextAppointment.time}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No upcoming appointments</p>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Icon name="Pill" className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Active Medications</p>
                {loading ? (
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                ) : dashboardData?.overview ? (
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.overview.activePrescriptions || 0} prescriptions
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default PatientSidebar;
