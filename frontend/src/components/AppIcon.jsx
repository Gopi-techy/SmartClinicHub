import React from 'react';
import * as LucideIcons from 'lucide-react';

const AppIcon = ({ name, size = 24, className = '', ...props }) => {
  // Map icon names to Lucide React icons
  const iconMap = {
    // Navigation
    Home: LucideIcons.Home,
    Dashboard: LucideIcons.LayoutDashboard,
    LayoutDashboard: LucideIcons.LayoutDashboard,
    Calendar: LucideIcons.Calendar,
    CalendarPlus: LucideIcons.CalendarPlus,
    Users: LucideIcons.Users,
    Settings: LucideIcons.Settings,
    User: LucideIcons.User,
    UserPlus: LucideIcons.UserPlus,
    UserCog: LucideIcons.UserCog,
    
    // Healthcare
    Heart: LucideIcons.Heart,
    Stethoscope: LucideIcons.Stethoscope,
    Activity: LucideIcons.Activity,
    Shield: LucideIcons.Shield,
    AlertTriangle: LucideIcons.AlertTriangle,
    AlertCircle: LucideIcons.AlertCircle,
    CheckCircle: LucideIcons.CheckCircle,
    CheckCircle2: LucideIcons.CheckCircle2,
    XCircle: LucideIcons.XCircle,
    Hospital: LucideIcons.Hospital,
    
    // Communication
    MessageCircle: LucideIcons.MessageCircle,
    MessageSquare: LucideIcons.MessageSquare,
    MessageSquarePlus: LucideIcons.MessageSquarePlus,
    Mail: LucideIcons.Mail,
    Phone: LucideIcons.Phone,
    Bell: LucideIcons.Bell,
    
    // Actions
    Plus: LucideIcons.Plus,
    Minus: LucideIcons.Minus,
    Edit: LucideIcons.Edit,
    Trash: LucideIcons.Trash,
    Trash2: LucideIcons.Trash2,
    Search: LucideIcons.Search,
    Filter: LucideIcons.Filter,
    Download: LucideIcons.Download,
    Upload: LucideIcons.Upload,
    Save: LucideIcons.Save,
    Eye: LucideIcons.Eye,
    EyeOff: LucideIcons.EyeOff,
    
    // Navigation
    ChevronDown: LucideIcons.ChevronDown,
    ChevronUp: LucideIcons.ChevronUp,
    ChevronLeft: LucideIcons.ChevronLeft,
    ChevronRight: LucideIcons.ChevronRight,
    ArrowLeft: LucideIcons.ArrowLeft,
    ArrowRight: LucideIcons.ArrowRight,
    ArrowUp: LucideIcons.ArrowUp,
    ArrowDown: LucideIcons.ArrowDown,
    RefreshCw: LucideIcons.RefreshCw,
    
    // Status
    Check: LucideIcons.Check,
    X: LucideIcons.X,
    Clock: LucideIcons.Clock,
    Timer: LucideIcons.Timer,
    Star: LucideIcons.Star,
    
    // UI Elements
    Menu: LucideIcons.Menu,
    MoreHorizontal: LucideIcons.MoreHorizontal,
    MoreVertical: LucideIcons.MoreVertical,
    Grid: LucideIcons.Grid,
    Grid3X3: LucideIcons.Grid3x3,
    List: LucideIcons.List,
    Maximize: LucideIcons.Maximize,
    Minimize: LucideIcons.Minimize,
    
    // Data
    FileText: LucideIcons.FileText,
    File: LucideIcons.File,
    Folder: LucideIcons.Folder,
    Database: LucideIcons.Database,
    BarChart3: LucideIcons.BarChart3,
    PieChart: LucideIcons.PieChart,
    TrendingUp: LucideIcons.TrendingUp,
    TrendingDown: LucideIcons.TrendingDown,
    
    // Authentication
    LogIn: LucideIcons.LogIn,
    LogOut: LucideIcons.LogOut,
    Lock: LucideIcons.Lock,
    Unlock: LucideIcons.Unlock,
    Key: LucideIcons.Key,
    
    // Time
    Sun: LucideIcons.Sun,
    Moon: LucideIcons.Moon,
    Sunrise: LucideIcons.Sunrise,
    Sunset: LucideIcons.Sunset,
    Loader2: LucideIcons.Loader2,
    
    // Location
    MapPin: LucideIcons.MapPin,
    Navigation: LucideIcons.Navigation,
    Globe: LucideIcons.Globe,
    
    // Media
    Camera: LucideIcons.Camera,
    Video: LucideIcons.Video,
    Mic: LucideIcons.Mic,
    Volume2: LucideIcons.Volume2,
    VolumeX: LucideIcons.VolumeX,
    
    // Social
    Share: LucideIcons.Share,
    Link: LucideIcons.Link,
    ExternalLink: LucideIcons.ExternalLink,
    
    // Development
    Code: LucideIcons.Code,
    Bug: LucideIcons.Bug,
    Zap: LucideIcons.Zap,
    Wifi: LucideIcons.Wifi,
    WifiOff: LucideIcons.WifiOff,
    Wrench: LucideIcons.Wrench,
    
    // Business
    DollarSign: LucideIcons.DollarSign,
    CreditCard: LucideIcons.CreditCard,
    Receipt: LucideIcons.Receipt,
    ShoppingCart: LucideIcons.ShoppingCart,
    
    // Health & Wellness
    Thermometer: LucideIcons.Thermometer,
    Droplets: LucideIcons.Droplets,
    Pill: LucideIcons.Pill,
    Syringe: LucideIcons.Syringe,
    Brain: LucideIcons.Brain,
    Bone: LucideIcons.Bone,
    
    // Emergency
    PhoneCall: LucideIcons.PhoneCall,
    Ambulance: LucideIcons.Ambulance,
    FirstAid: LucideIcons.FirstAid,
    
    // Additional icons
    Info: LucideIcons.Info,
    Hash: LucideIcons.Hash,
    UserX: LucideIcons.UserX,
    UserCheck: LucideIcons.UserCheck,
    
    // Default fallback
    HelpCircle: LucideIcons.HelpCircle
  };

  const IconComponent = iconMap[name] || iconMap.HelpCircle;

  return (
    <IconComponent
      size={size}
      className={className}
      {...props}
    />
  );
};

export default AppIcon;