# SmartClinicHub API Testing

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

### 2. Test with Postman (Recommended)

1. Import `SmartClinicHub_API.postman_collection.json`
2. Import `SmartClinicHub.postman_environment.json`
3. Select the "SmartClinicHub Environment"
4. Run the requests in order

### 3. Test with Automated Script

```bash
# Test all endpoints
npm run test:api

# Test specific areas
npm run test:api:auth          # Authentication only
npm run test:api:rbac          # Role-based access control
npm run test:api:appointments  # Appointment management
```

## 📋 What's Included

### Postman Collection (40+ Endpoints)

- ✅ **Authentication**: Register, Login, RBAC
- ✅ **User Management**: Profiles, Admin controls
- ✅ **Appointments**: Book, View, Update, Cancel
- ✅ **Emergency Services**: Alerts, Access
- ✅ **Health Monitoring**: Vitals, Dashboard
- ✅ **AI Features**: Symptom analysis, Recommendations
- ✅ **Pharmacy**: Prescriptions, Medications
- ✅ **Admin Panel**: Dashboard, Logs, System health

### Test Features

- 🔐 **Automated token management**
- 👥 **Multi-role testing (Patient, Doctor, Admin)**
- 🛡️ **RBAC verification**
- 📊 **Response validation**
- ⚡ **Performance monitoring**

## 🧪 Testing Workflow

### Phase 1: Authentication

1. Register Patient → Auto-saves user ID and token
2. Register Doctor → Auto-saves doctor ID and token
3. Register Admin → Auto-saves admin ID and token
4. Login with each role → Validates authentication

### Phase 2: RBAC Testing

1. Patient tries Admin route → Should get 403 Forbidden
2. Doctor accesses Appointments → Should succeed
3. Admin accesses User Management → Should succeed

### Phase 3: Core Features

1. Book Appointment → Patient books with Doctor
2. Update Appointment → Doctor marks as completed
3. Add Prescription → Doctor prescribes medication
4. Emergency Access → Test emergency protocols

## 🔧 Configuration

### Environment Variables

```env
# Required for backend
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/smartclinichub
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Optional for testing
API_BASE_URL=http://localhost:5000/api
```

### Postman Environment

- `baseUrl`: http://localhost:5000/api
- `authToken`: Auto-populated after login
- `doctorToken`: Auto-populated after doctor login
- `adminToken`: Auto-populated after admin login
- User IDs and resource IDs are auto-managed

## 📊 Sample Test Data

### Patient Registration

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "patient@smartclinic.com",
  "password": "SecurePass123!",
  "role": "patient",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "spouse",
    "phone": "+1234567891"
  }
}
```

### Appointment Booking

```json
{
  "doctorId": "{{doctorId}}",
  "appointmentDate": "2025-07-25T10:00:00.000Z",
  "appointmentType": "consultation",
  "reason": "Regular checkup",
  "symptoms": ["headache", "fatigue"]
}
```

## 🐛 Troubleshooting

### Common Issues

**❌ 401 Unauthorized**

- Solution: Re-login to get fresh token
- Check: Token expiration (default 7 days)

**❌ 403 Forbidden**

- Solution: Use correct role-based token
- Check: User permissions for endpoint

**❌ 500 Internal Server Error**

- Solution: Check server logs and database
- Check: MongoDB connection

**❌ Connection Refused**

- Solution: Ensure backend server is running
- Check: Port 5000 is available

### Environment Issues

```bash
# Check server status
curl http://localhost:5000/health

# Check database connection
mongosh mongodb://localhost:27017/smartclinichub

# Restart with logs
npm run dev
```

## 📈 Performance Testing

### Load Testing with Postman

1. Use Collection Runner
2. Set iterations (e.g., 100)
3. Set delay between requests
4. Monitor response times

### Metrics to Monitor

- Response time (< 200ms for most endpoints)
- Success rate (> 99%)
- Memory usage
- Database connection pool

## 🔒 Security Testing

### Authentication Tests

- ✅ Valid credentials → Success
- ❌ Invalid credentials → 401
- ❌ Expired tokens → 401
- ❌ Malformed tokens → 401

### Authorization Tests

- ✅ Admin routes with admin token → Success
- ❌ Admin routes with patient token → 403
- ✅ Patient data with patient token → Success
- ❌ Other user's data → 403

### Input Validation Tests

- ❌ SQL injection attempts → Sanitized
- ❌ XSS payloads → Escaped
- ❌ Invalid email formats → 400
- ❌ Weak passwords → 400

## 📚 Additional Resources

- [Postman Testing Guide](./POSTMAN_TESTING_GUIDE.md)
- [API Documentation](./API_DOCS.md)
- [Backend Architecture](./README.md)

## 🎯 Next Steps

1. **Import the Postman collection**
2. **Start with health check**
3. **Follow the sequential testing workflow**
4. **Check RBAC implementation**
5. **Test error scenarios**
6. **Monitor performance metrics**

Happy Testing! 🧪✨
