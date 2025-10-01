const Appointment = require('../models/Appointment');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments/book
 * @access  Private (Patient)
 */
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      duration = 30,
      type = 'consultation',
      mode = 'in-person',
      symptoms,
      chiefComplaint,
      urgencyLevel = 'medium',
      consultationFee = 0
    } = req.body;

    const patientId = req.user._id;

    // Check if doctor exists and is active
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
      isDeleted: false
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or unavailable'
      });
    }

    // Validate appointment must be at least 1 hour in advance
    const now = new Date();
    
    // Parse date and time properly to avoid timezone issues
    // appointmentDate format: "2025-10-02", startTime format: "09:00"
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create date in local timezone
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    
    // Require at least 1 hour advance booking
    const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
    
    // Check if appointment is at least 1 hour from now
    if (appointmentDateTime.getTime() < oneHourFromNow.getTime()) {
      const hoursUntilAppointment = ((appointmentDateTime.getTime() - now.getTime()) / (60 * 60 * 1000)).toFixed(1);
      return res.status(400).json({
        success: false,
        message: `Appointments must be booked at least 1 hour in advance. This appointment is ${hoursUntilAppointment} hours away.`
      });
    }

    // Check for appointment conflicts with correct field names
    const conflictingAppointments = await Appointment.findConflicts(
      doctorId, 
      new Date(appointmentDate), 
      startTime, 
      endTime || calculateEndTime(startTime, duration)
    );

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is not available at the requested time',
        conflicts: conflictingAppointments.map(appt => ({
          date: appt.appointmentDate,
          startTime: appt.startTime,
          endTime: appt.endTime
        }))
      });
    }

    // Calculate end time if not provided
    const finalEndTime = endTime || calculateEndTime(startTime, duration);


    // Create appointment and save to trigger pre-save middleware (bookingReference)
    // Generate bookingReference manually (same as model logic)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const bookingReference = `APP-${timestamp.toUpperCase()}-${random.toUpperCase()}`;
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime: finalEndTime,
      duration,
      type,
      mode,
      symptoms: symptoms || [],
      chiefComplaint: chiefComplaint || '',
      urgencyLevel,
      consultationFee,
      status: 'scheduled',
      createdBy: patientId,
      bookingReference
    });
    await appointment.save();

    // Populate appointment details
    await appointment.populate([
      { 
        path: 'patient', 
        select: 'firstName lastName email phone profilePicture' 
      },
      { 
        path: 'doctor', 
        select: 'firstName lastName professionalInfo.specialization professionalInfo.consultationFee' 
      }
    ]);

    // Generate meeting room for online appointments
    if (mode === 'online') {
      appointment.generateMeetingRoom();
      await appointment.save();
    }

    // Emit real-time notification to doctor
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor-${doctorId}`).emit('new-appointment', {
        appointmentId: appointment._id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        type: appointment.type,
        mode: appointment.mode
      });
    }

    logger.info(`Appointment booked successfully`, {
      appointmentId: appointment._id,
      patientId,
      doctorId,
      appointmentDate,
      bookingReference: appointment.bookingReference
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment,
        bookingReference: appointment.bookingReference,
        meetingUrl: appointment.videoCallDetails?.meetingUrl || null
      }
    });
  } catch (error) {
    logger.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate end time
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  
  const endHours = Math.floor(endMinutes / 60);
  const remainingMinutes = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}

/**
 * @desc    Get appointments for a user
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, date, limit = 10, page = 1, upcoming = false } = req.query;

    let query = { isDeleted: false };

    // Set query based on user role
    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'doctor') {
      query.doctor = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Filter for upcoming appointments only
    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone profilePicture')
      .populate('doctor', 'firstName lastName professionalInfo.specialization professionalInfo.title')
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Appointment.countDocuments(query);

    // Transform data for frontend
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      id: appointment._id,
      patientName: appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Unknown Patient',
      doctorName: appointment.doctor ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Unknown Doctor',
      doctorSpecialization: appointment.doctor?.professionalInfo?.specialization || 'General Practice',
      timeSlot: `${appointment.startTime} - ${appointment.endTime}`
    }));

    res.status(200).json({
      success: true,
      count: transformedAppointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transformedAppointments
    });
  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
};

/**
 * @desc    Update appointment status
 * @route   PUT /api/appointments/:id/status
 * @access  Private
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.patient.toString() === userId.toString() ||
      appointment.doctor.toString() === userId.toString() ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // Update appointment
    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }
    appointment.updatedAt = new Date();

    await appointment.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment-update', {
        appointmentId: appointment._id,
        patientId: appointment.patient,
        doctorId: appointment.doctor,
        status,
        updatedAt: appointment.updatedAt
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    logger.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
};

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender profilePicture')
      .populate('doctor', 'firstName lastName professionalInfo.specialization professionalInfo.title');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.patient._id.toString() === userId.toString() ||
      appointment.doctor._id.toString() === userId.toString() ||
      userRole === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    logger.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
};

/**
 * @desc    Get all registered patients in the system
 * @route   GET /api/appointments/doctor/all-patients
 * @access  Private (Doctor)
 */
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Build search query for patients
    let searchQuery = { role: 'patient' };
    if (search) {
      searchQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get all registered patients (not just those with appointments)
    const patients = await User.find(searchQuery)
      .select('firstName lastName email phone dateOfBirth gender profilePicture createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(searchQuery);

    // Transform data to match frontend expectations
    const transformedPatients = patients.map((patient, index) => ({
      id: patient._id,
      name: `${patient.firstName} ${patient.lastName}`,
      patientId: patient._id,
      appointmentTime: 'N/A', // No appointment data
      duration: 'N/A',
      reason: 'No appointments yet',
      status: 'Registered',
      priority: 'normal',
      appointmentDate: null,
      totalAppointments: 0,
      type: 'N/A',
      patient: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone || 'N/A',
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender || 'N/A',
        profilePicture: patient.profilePicture,
        registeredDate: patient.createdAt
      }
    }));

    res.status(200).json({
      success: true,
      count: transformedPatients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      patients: transformedPatients
    });
  } catch (error) {
    logger.error('Get doctor all patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
};

/**
 * @desc    Get all appointments for a doctor (with pagination)
 * @route   GET /api/appointments/doctor/patients
 * @access  Private (Doctor)
 */
const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status, limit = 50, page = 1 } = req.query;

    let query = {
      doctor: doctorId,
      isDeleted: false
    };

    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender profilePicture')
      .populate('doctor', 'firstName lastName professionalInfo.specialization')
      .sort({ appointmentDate: -1, startTime: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Appointment.countDocuments(query);

    // Transform data to match frontend expectations
    const patients = appointments.map(appointment => ({
      id: appointment._id,
      name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      patientId: appointment.patient._id,
      appointmentTime: appointment.startTime,
      duration: appointment.duration || 30,
      reason: appointment.chiefComplaint || appointment.symptoms?.[0] || 'General Consultation',
      status: appointment.status,
      priority: appointment.urgencyLevel || 'normal',
      appointmentDate: appointment.appointmentDate,
      type: appointment.type,
      mode: appointment.mode,
      bookingReference: appointment.bookingReference,
      patient: {
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        email: appointment.patient.email,
        phone: appointment.patient.phone,
        dateOfBirth: appointment.patient.dateOfBirth,
        gender: appointment.patient.gender,
        profilePicture: appointment.patient.profilePicture
      }
    }));

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      patients
    });
  } catch (error) {
    logger.error('Get doctor patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
};

/**
 * @desc    Cancel appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    logger.info('Cancel appointment request received', { appointmentId: id, userId });

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization (only patient or doctor can cancel)
    const isAuthorized = 
      appointment.patient.toString() === userId.toString() ||
      appointment.doctor.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Delete the appointment from database (hard delete)
    logger.info(`Starting appointment deletion`, { appointmentId: id });
    
    const deleteResult = await Appointment.findByIdAndDelete(id);
    
    logger.info(`Appointment deleted from database`, { 
      appointmentId: id,
      deleteResult: deleteResult ? 'success' : 'not found' 
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment-cancelled', {
        appointmentId: appointment._id,
        patientId: appointment.patient,
        doctorId: appointment.doctor,
        cancelledBy: userId,
        reason: reason || 'No reason provided'
      });
    }

    logger.info(`Appointment deleted`, {
      appointmentId: appointment._id,
      deletedBy: userId,
      reason
    });
    
    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment'
    });
  }
};

/**
 * @desc    Get available time slots for a doctor on a specific date
 * @route   GET /api/appointments/doctor/:doctorId/slots/:date
 * @access  Private
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const appointmentDate = new Date(date);

    // Check if doctor exists
    const doctor = await User.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true,
      isDeleted: false
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate,
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      isDeleted: false
    }).select('startTime endTime').lean();

    // Define available time slots (9 AM to 6 PM, 30-minute slots)
    const workingHours = {
      start: 9, // 9 AM
      end: 18,  // 6 PM
      slotDuration: 30 // 30 minutes
    };

    const availableSlots = [];
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTime = calculateEndTime(timeSlot, workingHours.slotDuration);
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(appointment => {
          return (timeSlot < appointment.endTime && endTime > appointment.startTime);
        });

        if (!hasConflict) {
          availableSlots.push({
            startTime: timeSlot,
            endTime: endTime,
            available: true
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      date: appointmentDate,
      doctorId,
      availableSlots,
      totalSlots: availableSlots.length
    });
  } catch (error) {
    logger.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
};

/**
 * @desc    Get appointment statistics for dashboard
 * @route   GET /api/appointments/stats
 * @access  Private
 */
const getAppointmentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { period = 'month' } = req.query; // week, month, year

    let query = { isDeleted: false };
    
    if (userRole === 'patient') {
      query.patient = userId;
    } else if (userRole === 'doctor') {
      query.doctor = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    query.appointmentDate = { $gte: startDate };

    // Get appointment counts by status
    const stats = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$consultationFee' }
        }
      }
    ]);

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({
      ...query,
      appointmentDate: { $gte: now },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Get today's appointments
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      ...query,
      appointmentDate: { $gte: todayStart, $lt: todayEnd }
    });

    // Format response
    const formattedStats = {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      upcoming: upcomingAppointments,
      today: todayAppointments,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          revenue: stat.totalRevenue || 0
        };
        return acc;
      }, {}),
      totalRevenue: stats.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0),
      period
    };

    res.status(200).json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    logger.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment statistics'
    });
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAppointmentById,
  getDoctorPatients,
  getAllPatients,
  cancelAppointment,
  getAvailableSlots,
  getAppointmentStats
};
