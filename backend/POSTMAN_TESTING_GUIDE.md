# SmartClinicHub API Testing with Postman

## Overview

This comprehensive Postman collection provides full testing coverage for the SmartClinicHub healthcare platform API. It includes authentication, RBAC (Role-Based Access Control), user management, appointments, medical records, emergency services, AI features, and administrative functions.

## Files Included

- `SmartClinicHub_API.postman_collection.json` - Complete API collection with 40+ endpoints
- `SmartClinicHub.postman_environment.json` - Environment variables and tokens

## Quick Setup

### 1. Import into Postman

1. Open Postman Desktop App
2. Click "Import" button (top left)
3. Drag and drop both JSON files or click "Upload Files"
4. Select the "SmartClinicHub Environment" from the environment dropdown (top right)

### 2. Start Your Backend Server

```bash
cd backend
npm install
npm run dev
```

Your API should be running on `http://localhost:5000`

### 3. Test the Setup

Run the "API Health Check" request first to ensure your server is running.

## Environment Variables

The collection automatically manages these variables:

- `baseUrl` - API base URL (http://localhost:5000/api)
- `authToken` - Patient JWT token (auto-populated)
- `doctorToken` - Doctor JWT token (auto-populated)
- `adminToken` - Admin JWT token (auto-populated)
- `userId`, `patientId`, `doctorId`, `adminId` - User IDs (auto-populated)
- `appointmentId` - Appointment ID (auto-populated)

## Complete Testing Workflow

### Phase 1: Basic Authentication

1. **Register Patient** → Creates patient account with medical history
2. **Register Doctor** → Creates doctor account with professional info
3. **Register Admin** → Creates admin account with system access
4. **Login Patient** → Authenticates patient and sets `authToken`
5. **Login Doctor** → Authenticates doctor and sets `doctorToken`
6. **Login Admin** → Authenticates admin and sets `adminToken`
7. **Get Current User** → Verifies authentication works

### Phase 2: RBAC (Role-Based Access Control) Testing

1. **Patient Access to Admin Route** → Should return 403 Forbidden
2. **Doctor Access to Appointments** → Should succeed
3. **Admin Access to All Users** → Should succeed with full user list

### Phase 3: User Management

1. **Get All Users (Admin Only)** → Admin can view all users with pagination
2. **Get Users by Role** → Filter users by role (doctor, patient, admin)
3. **Get User Profile** → Users can view their own profile
4. **Update User Profile** → Users can update their information
5. **Change Password** → Secure password change functionality

### Phase 4: Appointment Management

1. **Book Appointment** → Patient books appointment with doctor
2. **Get My Appointments** → View user's appointments
3. **Get Appointment by ID** → Detailed appointment information
4. **Update Appointment Status** → Doctor marks appointment as completed
5. **Cancel Appointment** → Patient or doctor cancels appointment

### Phase 5: Medical Services

1. **Add Vital Signs** → Patient records health data
2. **Get Health Dashboard** → View health trends and analytics
3. **Add Prescription** → Doctor prescribes medication
4. **Search Medications** → Find available medications
5. **Get Prescription** → View patient prescriptions

### Phase 6: Emergency Services

1. **Emergency Access** → Access patient data in emergency situations
2. **Create Emergency Alert** → Send emergency notifications

### Phase 7: AI Features

1. **AI Symptom Analysis** → Get AI-powered symptom assessment
2. **AI Health Recommendations** → Personalized health suggestions

### Phase 8: Admin Panel

1. **Admin Dashboard** → System statistics and overview
2. **System Health Check** → Monitor system status
3. **Get System Logs** → View application logs

## Collection Structure

### 1. Authentication (8 endpoints)

- ✅ Register Patient/Doctor/Admin with role-specific data
- ✅ Login with different user roles
- ✅ Get current user profile
- ✅ Logout functionality
- ✅ Forgot password feature

### 2. User Management (5 endpoints)

- ✅ Get all users with pagination (Admin only)
- ✅ Filter users by role
- ✅ Get/Update user profile
- ✅ Secure password change

### 3. Appointments (5 endpoints)

- ✅ Book appointments with doctors
- ✅ View appointments (role-based filtering)
- ✅ Get detailed appointment information
- ✅ Update appointment status (Doctor only)
- ✅ Cancel appointments

### 4. RBAC Testing (3 endpoints)

- ✅ Test unauthorized access (should fail)
- ✅ Test role-based permissions
- ✅ Verify access control enforcement

### 5. Admin Panel (3 endpoints)

- ✅ Admin dashboard with statistics
- ✅ System health monitoring
- ✅ Application logs access

### 6. Emergency Services (2 endpoints)

- ✅ Emergency patient data access
- ✅ Create emergency alerts

### 7. Health Monitoring (2 endpoints)

- ✅ Record vital signs
- ✅ Health dashboard analytics

### 8. AI Features (2 endpoints)

- ✅ AI-powered symptom analysis
- ✅ Personalized health recommendations

### 9. Pharmacy (3 endpoints)

- ✅ Search medications
- ✅ View prescriptions
- ✅ Add prescriptions (Doctor only)

### 10. System Health (2 endpoints)

- ✅ API health check
- ✅ Database connectivity test

## Testing Best Practices

### Sequential Testing

1. Always start with user registration/login
2. Test authentication before protected routes
3. Use role-specific tokens for RBAC testing

### Error Testing

- Test with invalid credentials
- Test unauthorized access attempts
- Test with malformed request data

### Data Management

- Use realistic test data
- Test edge cases (empty fields, special characters)
- Test data validation rules

## Sample Test Data

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

### Doctor Registration

```json
{
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "email": "doctor@smartclinic.com",
  "password": "DoctorPass123!",
  "role": "doctor",
  "license": "MD123456789",
  "specialization": "Cardiology",
  "yearsOfExperience": 10
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

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Token expired or invalid
   - Solution: Re-login to get fresh token

2. **403 Forbidden**: Insufficient permissions
   - Solution: Use correct role-based token

3. **500 Internal Server Error**: Server issue
   - Solution: Check server logs and database connection

4. **404 Not Found**: Endpoint doesn't exist
   - Solution: Verify URL and route definitions

### Environment Setup

- Ensure backend server is running on port 5000
- Check MongoDB connection
- Verify all required environment variables are set

## Advanced Features

### Automated Testing

The collection includes test scripts that:

- ✅ Automatically extract and store tokens
- ✅ Validate response structures
- ✅ Check status codes
- ✅ Verify role-based access control

### Load Testing

- Use Postman Collection Runner for bulk testing
- Test concurrent user scenarios
- Monitor response times and error rates

## API Documentation

Each request includes:

- 📝 Detailed descriptions
- 🔑 Authentication requirements
- 📊 Expected response formats
- ⚠️ Error handling examples
- 🧪 Automated test assertions

This collection provides comprehensive coverage of all SmartClinicHub API functionality, making it easy to test, debug, and validate your healthcare platform's backend services.

- AI Health Insights

### 9. Health Check

- API Health Check
- Server Health Check

## Authentication Notes

### JWT Token Management

- Tokens are automatically captured and stored in environment variables
- The collection includes bearer token authentication at the collection level
- Individual requests inherit authentication unless overridden

### Password Requirements

- Minimum 8 characters
- Must include uppercase letters, numbers, and special characters
- Examples in collection: "SecurePass123!", "DoctorPass123!", "AdminPass123!"

## Sample Test Data

### Patient Registration:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "patient",
  "phone": "+1234567890"
}
```

### Doctor Registration:

```json
{
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "email": "dr.smith@clinic.com",
  "password": "DoctorPass123!",
  "role": "doctor",
  "specialization": "cardiology"
}
```

### Appointment Booking:

```json
{
  "doctorId": "{{doctorId}}",
  "appointmentDate": "2025-07-25",
  "startTime": "10:00",
  "type": "consultation",
  "symptoms": ["headache", "fever"]
}
```

## Testing Best Practices

### 1. Sequential Testing

Run requests in this order for best results:

1. Health Check → Register Users → Login → Use authenticated endpoints

### 2. Environment Management

- Use separate environments for development/staging/production
- Update baseUrl for different environments
- Keep tokens secure and refresh regularly

### 3. Error Handling

- Check response status codes
- Verify error messages
- Test edge cases (invalid data, unauthorized access)

### 4. RBAC Validation

- Test each role's access permissions
- Verify proper 403 responses for unauthorized access
- Confirm users can only access their own data

## Common Issues & Solutions

### 1. Server Not Running

**Error**: Connection refused
**Solution**: Ensure backend server is running on port 5000

```bash
cd backend
npm start
```

### 2. Authentication Failed

**Error**: 401 Unauthorized
**Solution**:

- Check if token is set in environment
- Re-run login request to refresh token
- Verify user credentials

### 3. MongoDB Connection Issues

**Error**: Database connection failed
**Solution**:

- Check MongoDB is running
- Verify .env database connection string
- Ensure network connectivity

### 4. CORS Issues

**Error**: CORS policy blocked
**Solution**:

- Verify FRONTEND_URL in .env matches request origin
- Check server CORS configuration

## Environment Variables Required

### Backend .env file should contain:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/smartclinichub
JWT_SECRET=your-jwt-secret-here
```

## Advanced Testing

### 1. Automation

- Use Postman's Test Scripts for automated validation
- Create test suites for different scenarios
- Set up monitoring for API uptime

### 2. Load Testing

- Use Postman's performance testing features
- Test concurrent user scenarios
- Monitor response times and error rates

### 3. Integration Testing

- Test complete user workflows
- Verify data consistency across endpoints
- Test error handling and edge cases

## Support

For issues or questions:

1. Check server logs for detailed error messages
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Test basic connectivity with health check endpoints

## Security Notes

- Never commit real credentials to version control
- Use environment-specific variables
- Rotate JWT secrets regularly
- Test with minimal required permissions
- Validate all input sanitization
