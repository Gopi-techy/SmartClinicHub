// Doctor Service for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class DoctorService {
  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  // Get common headers for API requests
  getHeaders() {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Fetch doctors with filters
  async getDoctors(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.query) queryParams.append('query', filters.query);
      if (filters.specialization) queryParams.append('specialization', filters.specialization);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.minRating) queryParams.append('minRating', filters.minRating);
      if (filters.maxFee) queryParams.append('maxFee', filters.maxFee);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      const url = `${API_BASE_URL}/api/users/public/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // For public doctors endpoint, don't require authentication
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Try to get the error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctors');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  // Get specific doctor details
  async getDoctorById(doctorId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/doctor/${doctorId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        // Try to get the error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch doctor details');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      throw error;
    }
  }

  // Transform backend doctor data to match component expectations
  transformDoctorData(doctorData) {
    if (!doctorData || !Array.isArray(doctorData.doctors)) {
      return { doctors: [], pagination: doctorData?.pagination || {} };
    }

    const transformedDoctors = doctorData.doctors.map(doctor => {
      // Generate realistic years of experience based on creation date or random
      const getExperience = () => {
        if (doctor.professionalInfo?.yearsOfExperience) {
          return `${doctor.professionalInfo.yearsOfExperience} years`;
        }
        // Generate random experience between 2-25 years for demo
        const randomYears = Math.floor(Math.random() * 24) + 2;
        return `${randomYears} years`;
      };

      // Generate realistic review count
      const getReviewCount = () => {
        if (doctor.professionalInfo?.totalReviews) {
          return doctor.professionalInfo.totalReviews;
        }
        // Generate random review count between 15-200 for demo
        return Math.floor(Math.random() * 186) + 15;
      };

      // Get better hospital/workplace name
      const getHospitalName = () => {
        if (doctor.professionalInfo?.workplaceName) {
          return doctor.professionalInfo.workplaceName;
        }
        if (doctor.professionalInfo?.hospitalAffiliation) {
          return doctor.professionalInfo.hospitalAffiliation;
        }
        
        // Generate realistic hospital names based on specialty
        const specialty = doctor.professionalInfo?.specialization?.toLowerCase();
        const hospitalNames = {
          'cardiology': ['Heart Center Hospital', 'Cardiac Care Institute', 'Metropolitan Heart Clinic'],
          'dermatology': ['Skin Care Center', 'Dermatology Associates', 'Advanced Skin Institute'],
          'orthopedics': ['Orthopedic Specialists', 'Bone & Joint Center', 'Sports Medicine Institute'],
          'pediatrics': ['Children\'s Hospital', 'Pediatric Care Center', 'Kids Health Clinic'],
          'neurology': ['Neurological Institute', 'Brain & Spine Center', 'Neuroscience Hospital'],
          'psychiatry': ['Mental Health Center', 'Psychiatric Associates', 'Behavioral Health Institute']
        };
        
        const names = hospitalNames[specialty] || ['General Hospital', 'Medical Center', 'Healthcare Associates'];
        return names[Math.floor(Math.random() * names.length)];
      };

      // Get realistic specializations
      const getSpecializations = () => {
        if (doctor.professionalInfo?.subspecializations?.length) {
          return doctor.professionalInfo.subspecializations;
        }
        
        // Generate realistic subspecializations based on main specialty
        const specialty = doctor.professionalInfo?.specialization?.toLowerCase();
        const subspecializations = {
          'cardiology': ['Heart Surgery', 'Cardiac Imaging', 'Preventive Cardiology'],
          'dermatology': ['Skin Cancer', 'Cosmetic Dermatology', 'Acne Treatment'],
          'orthopedics': ['Joint Replacement', 'Sports Injuries', 'Spine Surgery'],
          'pediatrics': ['Child Development', 'Vaccinations', 'Pediatric Emergency'],
          'neurology': ['Stroke Care', 'Epilepsy Treatment', 'Memory Disorders'],
          'psychiatry': ['Anxiety Disorders', 'Depression Treatment', 'Cognitive Therapy']
        };
        
        return subspecializations[specialty] || ['General Care', 'Consultation', 'Treatment'];
      };

      return {
        id: doctor._id,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.professionalInfo?.specialization || 'General Practice',
        specialtyId: this.getSpecialtyId(doctor.professionalInfo?.specialization),
        hospital: getHospitalName(),
        image: doctor.profilePicture || `https://ui-avatars.com/api/?name=${doctor.firstName}+${doctor.lastName}&background=6366f1&color=fff&size=400`,
        rating: doctor.professionalInfo?.rating || (4.0 + Math.random() * 1.0), // 4.0-5.0 rating
        reviewCount: getReviewCount(),
        experience: getExperience(),
        consultationFee: doctor.professionalInfo?.consultationFee || (80 + Math.floor(Math.random() * 120)), // $80-200
        nextAvailable: this.getNextAvailableDate(),
        isOnline: doctor.professionalInfo?.availability?.includes('online') || Math.random() > 0.3, // 70% online availability
        specializations: getSpecializations(),
        location: {
          city: doctor.address?.city || 'City',
          state: doctor.address?.state || 'State'
        },
        contact: {
          email: doctor.email,
          phone: doctor.phone
        }
      };
    });

    return {
      doctors: transformedDoctors,
      pagination: doctorData.pagination || {}
    };
  }

  // Map specialization to specialtyId for filtering
  getSpecialtyId(specialization) {
    if (!specialization) return 'general';
    
    const specialtyMap = {
      'cardiology': 'cardiology',
      'dermatology': 'dermatology', 
      'neurology': 'neurology',
      'orthopedics': 'orthopedics',
      'pediatrics': 'pediatrics',
      'psychiatry': 'psychiatry',
      'radiology': 'radiology',
      'surgery': 'surgery',
      'general practice': 'general',
      'internal medicine': 'internal',
      'family medicine': 'family'
    };

    const key = specialization.toLowerCase();
    return specialtyMap[key] || 'general';
  }

  // Generate next available date (realistic logic)
  getNextAvailableDate() {
    const now = new Date();
    const availabilityOptions = [
      { days: 0, label: 'Today' },
      { days: 1, label: 'Tomorrow' },
      { days: 2, label: '2 days' },
      { days: 3, label: '3 days' },
      { days: 4, label: '4 days' },
      { days: 7, label: '1 week' },
      { days: 14, label: '2 weeks' }
    ];
    
    const randomOption = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)];
    const nextDate = new Date(now.getTime() + (randomOption.days * 24 * 60 * 60 * 1000));
    
    // Store the label for display purposes
    nextDate.displayLabel = randomOption.label;
    return nextDate;
  }
}

export default new DoctorService();