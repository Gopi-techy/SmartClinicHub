# SmartClinicHub Backend

## 🏥 Comprehensive Healthcare Platform Backend

SmartClinicHub Backend is a robust, scalable Node.js/Express API server that powers a comprehensive healthcare platform with AI-enabled emergency access, telemedicine capabilities, and intelligent medical assistance.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Patient, Doctor, Admin, Pharmacy)
- Multi-factor authentication support
- OAuth integration (Google, Facebook)
- Secure password policies with bcrypt hashing

### 🚨 Emergency Access System
- QR code-based emergency medical information access
- Biometric fallback authentication
- Location-based emergency access
- Real-time emergency alerts
- Emergency contact notification system
- Critical health information access for first responders

### 🤖 AI-Powered Features
- **Gemini AI Integration** for medical assistance
- Intelligent symptom analysis and triage
- Drug interaction checking
- Emergency medical guidance
- Appointment summary generation
- Personalized health insights

### 📅 Appointment Management
- Intelligent scheduling with conflict detection
- Video consultation support
- Automated reminders (Email, SMS, Push)
- Real-time appointment updates
- Multi-provider calendar management

### 💊 Prescription Management
- Digital prescription generation with QR codes
- Pharmacy integration
- Drug interaction monitoring
- Refill tracking and management
- Secure prescription transmission

### 📊 Health Monitoring
- Vital signs tracking and analysis
- Symptom logging with AI analysis
- Wellness goal setting and tracking
- Health trend analysis
- Personalized recommendations

### 💳 Payment Processing
- Stripe integration for secure payments
- Subscription management
- Multi-currency support
- Automated billing and invoicing
- Payment analytics and reporting

### 📁 File Management
- Azure Blob Storage integration
- Medical document management
- Image processing and optimization
- Secure file sharing with expiring links
- DICOM support for medical imaging

### 🔔 Real-time Notifications
- Multi-channel notifications (Email, SMS, Push)
- Real-time updates via WebSocket
- Appointment reminders
- Emergency alerts
- System notifications

### 📈 Admin Dashboard
- Comprehensive analytics and reporting
- User management
- System health monitoring
- Audit logging
- Payment analytics

## 🛠 Technical Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with refresh tokens
- **AI Integration:** Google Gemini API
- **Cloud Storage:** Azure Blob Storage
- **Payment Processing:** Stripe
- **Email/SMS:** SendGrid, Twilio
- **Real-time Communication:** Socket.IO
- **File Processing:** Sharp (image optimization)
- **Security:** Helmet, Rate limiting, CORS

## 📋 Prerequisites

- Node.js 18.0 or higher
- MongoDB 5.0 or higher
- Redis (optional, for caching)
- Azure Storage Account
- Google Gemini API key
- Stripe account (for payments)
- SendGrid account (for emails)
- Twilio account (for SMS)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd SmartClinicHub/backend
npm install
```

### 2. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Database Setup

```bash
# Start MongoDB (if running locally)
mongod

# The application will create collections automatically
```

### 4. Start Development Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Configuration management
│   │   └── database.js        # Database connection
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Appointment.js      # Appointment model
│   │   ├── Prescription.js     # Prescription model
│   │   └── EmergencyAccess.js  # Emergency access model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management
│   │   ├── appointments.js     # Appointment management
│   │   ├── emergency.js        # Emergency access
│   │   ├── ai.js               # AI-powered features
│   │   ├── pharmacy.js         # Prescription management
│   │   ├── admin.js            # Admin functionality
│   │   └── health.js           # Health monitoring
│   ├── services/
│   │   ├── notificationService.js  # Multi-channel notifications
│   │   ├── fileUploadService.js    # File management
│   │   ├── aiProcessingService.js  # AI integration
│   │   └── paymentService.js       # Payment processing
│   └── utils/
│       ├── logger.js           # Logging utility
│       └── encryption.js       # Encryption utilities
├── server.js                   # Main server file
├── package.json
└── .env.example               # Environment variables template
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/upload-avatar` - Upload profile picture

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Emergency Access
- `POST /api/emergency/setup` - Setup emergency access
- `POST /api/emergency/access` - Access emergency info
- `GET /api/emergency/qr/:patientId` - Generate QR code

### AI Features
- `POST /api/ai/symptom-checker` - Analyze symptoms
- `POST /api/ai/emergency-guidance` - Emergency AI guidance
- `POST /api/ai/triage` - Medical triage
- `POST /api/ai/medication-interaction` - Drug interaction check

### Pharmacy
- `GET /api/pharmacy/prescriptions` - List prescriptions
- `POST /api/pharmacy/verify-qr` - Verify prescription QR
- `POST /api/pharmacy/dispense/:id` - Dispense medication

### Health Monitoring
- `POST /api/health/vitals` - Record vital signs
- `GET /api/health/vitals/:patientId` - Get vital history
- `POST /api/health/symptoms` - Log symptoms
- `GET /api/health/wellness-dashboard` - Wellness overview

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics` - System analytics

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with automatic expiration
- Role-based access control
- Rate limiting on sensitive endpoints
- Account lockout after failed attempts

### Data Protection
- AES-256-GCM encryption for sensitive data
- HTTPS enforcement in production
- Input validation and sanitization
- SQL injection protection with Mongoose

### Emergency Security
- Multi-factor emergency access verification
- Audit trails for all emergency access
- Automatic emergency contact alerts
- Time-limited access tokens

## 🔧 Configuration

### Environment Variables

Key environment variables you need to configure:

```bash
# Core Configuration
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/smartclinichub
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-32-character-encryption-key

# External Services
GEMINI_API_KEY=your-gemini-api-key
AZURE_STORAGE_CONNECTION_STRING=your-azure-connection
STRIPE_SECRET_KEY=your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
TWILIO_AUTH_TOKEN=your-twilio-token

# Security
CORS_ORIGINS=https://yourdomain.com
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_MAX=100
```

## 📊 Monitoring & Logging

### Logging
- Structured logging with Winston
- Audit trails for security events
- Performance monitoring
- Error tracking with stack traces

### Health Checks
- Database connectivity monitoring
- External service health checks
- Memory and CPU usage tracking
- Automated alerting for critical issues

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   # Configure all production environment variables
   ```

2. **Database**
   ```bash
   # Use MongoDB Atlas or your production MongoDB
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartclinichub
   ```

3. **SSL/TLS**
   ```bash
   # Configure HTTPS certificates
   # Use a reverse proxy like Nginx
   ```

4. **Process Management**
   ```bash
   # Use PM2 for process management
   npm install -g pm2
   pm2 start server.js --name "smartclinichub-backend"
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:auth
npm run test:emergency
npm run test:ai
```

## 📈 Performance Optimization

- Database indexing for optimal query performance
- Redis caching for frequently accessed data
- Image optimization and compression
- API response compression
- Connection pooling
- Lazy loading for large datasets

## 🔄 API Versioning

The API uses URL versioning:
- Current version: `/api/v1/`
- Future versions: `/api/v2/`, etc.

## 📚 Documentation

- API documentation available at `/api-docs` (Swagger UI)
- Postman collection included in `/docs/`
- Database schema documentation in `/docs/database/`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs/`

## 🔮 Roadmap

- [ ] Machine Learning models for predictive analytics
- [ ] Advanced telemedicine features
- [ ] IoT device integration
- [ ] Blockchain for medical records
- [ ] Advanced AI diagnosis assistance
- [ ] Mobile SDK for native apps

---

**SmartClinicHub Backend** - Empowering healthcare with AI and technology 🏥✨
