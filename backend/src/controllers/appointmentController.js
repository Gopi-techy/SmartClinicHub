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
      type = 'consultation',
      mode = 'in-person',
      symptoms,
      chiefComplaint,
      urgencyLevel = 'medium'
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

    // Check for appointment conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      status: { $nin: ['cancelled', 'completed'] }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is not available at the requested time'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      endTime,
      type,
      mode,
      symptoms: symptoms || [],
      chiefComplaint,
      urgencyLevel,
      status: 'scheduled'
    });

    // Populate appointment details
    await appointment.populate([
      { path: 'patientId', select: 'fullName email phone' },
      { path: 'doctorId', select: 'fullName email specialization' }
    ]);

    logger.info(`Appointment booked successfully`, {
      appointmentId: appointment._id,
      patientId,
      doctorId,
      appointmentDate
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    logger.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment'
    });
  }
};

/**
 * @desc    Get appointments for a user
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { status, date, limit = 10, page = 1 } = req.query;

    let query = {};

    // Set query based on user role
    if (userRole === 'patient') {
      query.patientId = userId;
    } else if (userRole === 'doctor') {
      query.doctorId = userId;
    }

    // Add filters
    if (status) {
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

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName email specialization')
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      appointments
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
      appointment.patientId.toString() === userId.toString() ||
      appointment.doctorId.toString() === userId.toString() ||
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
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
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
      .populate('patientId', 'fullName email phone dateOfBirth gender')
      .populate('doctorId', 'fullName email specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.patientId._id.toString() === userId.toString() ||
      appointment.doctorId._id.toString() === userId.toString() ||
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

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization (only patient or doctor can cancel)
    const isAuthorized = 
      appointment.patientId.toString() === userId.toString() ||
      appointment.doctorId.toString() === userId.toString();

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

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = userId;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment-cancelled', {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        cancelledBy: userId,
        reason
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment'
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
  cancelAppointment
};
