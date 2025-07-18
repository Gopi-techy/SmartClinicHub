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
  cancelAppointment
};
