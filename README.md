# SmartClinicHub

> AI-Powered Healthcare Management Platform

SmartClinicHub is a comprehensive healthcare management system that leverages artificial intelligence to streamline medical operations, enhance patient care, and improve healthcare accessibility.

## 🚀 Features

### Core Healthcare Management

- **Patient Portal** - Complete health records, appointment booking, prescription management
- **Doctor Dashboard** - Patient management, appointment scheduling, medical records access
- **Admin Panel** - System administration, user management, analytics
- **Nurse Interface** - Patient care coordination, vital signs monitoring

### AI-Powered Features

- **AI Health Assistant** - Intelligent symptom checking and health guidance
- **Medical Insights** - AI-driven health analytics and recommendations
- **Smart Triage** - Automated patient prioritization and care routing
- **Predictive Analytics** - Health trend analysis and early intervention alerts

### Advanced Capabilities

- **Real-time Communication** - Socket.IO powered live updates and notifications
- **Video Consultations** - Integrated telemedicine platform
- **Emergency Services** - 24/7 emergency response and alert system
- **Mobile-First PWA** - Progressive Web App with offline capabilities
- **HIPAA Compliant** - Enterprise-grade security and privacy protection

## 🏗️ Architecture

### Backend (Node.js + Express)

- RESTful API with comprehensive endpoints
- MongoDB database with optimized schemas
- JWT authentication with role-based access control
- Real-time features with Socket.IO
- Integration with Google Gemini AI
- Azure Blob Storage for file management
- Stripe payment processing

### Frontend (React.js PWA)

- Modern React 18 with hooks and context
- Redux Toolkit for state management
- Progressive Web App capabilities
- Responsive design with Tailwind CSS
- Role-based routing and components
- Real-time updates via WebSocket

### AI Integration

- **Google Gemini AI** for intelligent health assistance
- Natural language processing for medical queries
- Symptom analysis and health recommendations
- Medical document processing and insights

## 🛠️ Technology Stack

**Backend:**

- Node.js & Express.js
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT for authentication
- Google Gemini AI API
- Azure Blob Storage
- Stripe Payments

**Frontend:**

- React.js 18 with modern hooks
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- PWA with service workers
- Socket.IO client for real-time updates

**DevOps & Tools:**

- Git version control
- Environment-based configuration
- API documentation
- Error logging and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key (optional for AI features)
- Azure Storage account (optional for file uploads)
- Stripe account (optional for payments)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd SmartClinicHub
npm run setup
```

### 2. Environment Configuration

The setup script will create `.env` files from examples. Configure them with your API keys:

**Backend (.env):**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartclinichub
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (.env):**

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:3000
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
SmartClinicHub/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration files
│   └── package.json
│
├── frontend/               # React.js PWA
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json
│
├── docker-compose.yml      # Docker configuration
└── README.md               # Project documentation
```

## 🏥 User Roles & Permissions

### Patient

- View and manage personal health records
- Book and manage appointments
- Access AI health assistant
- View prescriptions and lab results
- Emergency service access

### Doctor

- Manage patient records and appointments
- Prescribe medications
- Access AI diagnostic tools
- Video consultations
- Emergency response capabilities

### Nurse

- Patient care coordination
- Vital signs monitoring
- Appointment assistance
- Emergency response support

### Admin

- System administration
- User management
- Analytics and reporting
- Configuration management

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Granular permission system
- **Data Encryption** - Sensitive data encryption at rest and in transit
- **HIPAA Compliance** - Healthcare data protection standards
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Comprehensive data validation
- **Audit Logging** - Complete activity tracking

## 🌟 Key Highlights

- **AI-First Approach** - Integrated Google Gemini for intelligent healthcare assistance
- **Real-time Capabilities** - Live updates and notifications
- **Mobile Optimized** - Progressive Web App for mobile devices
- **Scalable Architecture** - Microservices-ready design
- **Healthcare Focused** - Purpose-built for medical workflows
- **Emergency Ready** - 24/7 emergency response system

## 📈 Development Status

- ✅ Backend API (Complete)
- ✅ Frontend Infrastructure (Complete)
- ✅ Authentication System (Complete)
- ✅ Role-based Dashboards (Complete)
- ✅ AI Integration (Complete)
- ✅ Page Components (Complete)
- ✅ Database Integration (Complete)
- ✅ Real-time Features (Complete)
- 🔄 ML Model Integration (Planned)
- 🔄 Production Deployment (Planned)

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Manual Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests with coverage
npm run test:coverage
```

## 📊 API Documentation

Once the backend is running, access the API documentation:

- **Swagger UI**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 🔧 Available Scripts

### Root Level Scripts

```bash
npm run dev              # Start both frontend and backend in development
npm run build            # Build both frontend and backend
npm run start            # Start both frontend and backend in production
npm run test             # Run all tests
npm run lint             # Run linting for both projects
npm run setup            # Complete setup including dependencies and env files
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
```

### Backend Scripts

```bash
npm run dev:backend      # Start backend in development mode
npm run build:backend    # Build backend
npm run test:backend     # Run backend tests
npm run lint:backend     # Run backend linting
```

### Frontend Scripts

```bash
npm run dev:frontend     # Start frontend in development mode
npm run build:frontend   # Build frontend
npm run test:frontend    # Run frontend tests
npm run lint:frontend    # Run frontend linting
```

## 🤝 Contributing

This project follows healthcare industry standards and best practices. Contributions are welcome for approved features and improvements.

### Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Testing**: Write tests for new features
3. **Documentation**: Update documentation for API changes
4. **Security**: Follow security best practices for healthcare data
5. **Accessibility**: Ensure WCAG compliance for all UI components

## 📝 License

This project is proprietary software developed for healthcare management purposes.

## 🚨 Emergency Features

SmartClinicHub includes comprehensive emergency response capabilities:

- **24/7 Emergency Access** - Immediate access to emergency protocols
- **Real-time Alerts** - Instant notification system for critical situations
- **Emergency Contacts** - Quick access to emergency services
- **Triage System** - AI-powered emergency assessment
- **Location Services** - GPS-based emergency response coordination

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Database Backups** - Automated daily backups
2. **Security Updates** - Regular dependency updates
3. **Performance Monitoring** - Real-time system health monitoring
4. **User Training** - Regular training sessions for healthcare staff

### Version Updates

- **Major Updates**: Quarterly releases with new features
- **Minor Updates**: Monthly bug fixes and improvements
- **Security Patches**: Immediate deployment for security issues

---

**SmartClinicHub** - Revolutionizing Healthcare with AI

_Built with ❤️ for better healthcare outcomes_
