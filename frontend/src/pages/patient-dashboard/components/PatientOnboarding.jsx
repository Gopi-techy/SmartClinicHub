import React from 'react';
import { motion } from 'framer-motion';
import { FaUserMd, FaCalendarCheck, FaFileAlt, FaHeartbeat, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import Button from '../../../components/ui/Button';

const PatientOnboarding = ({ onComplete, onSkip }) => {
  const steps = [
    {
      icon: <FaUserMd className="h-8 w-8" />,
      title: 'Complete Your Profile',
      description: 'Add your personal information, medical history, and emergency contacts',
      action: 'Complete Profile',
      color: 'blue'
    },
    {
      icon: <FaCalendarCheck className="h-8 w-8" />,
      title: 'Book Your First Appointment',
      description: 'Schedule a consultation with one of our qualified healthcare providers',
      action: 'Book Appointment',
      color: 'green'
    },
    {
      icon: <FaFileAlt className="h-8 w-8" />,
      title: 'Upload Medical Records',
      description: 'Share your existing medical records for better continuity of care',
      action: 'Upload Records',
      color: 'purple'
    },
    {
      icon: <FaHeartbeat className="h-8 w-8" />,
      title: 'Track Your Health',
      description: 'Monitor vital signs, medications, and health progress over time',
      action: 'Learn More',
      color: 'red'
    }
  ];

  const getColorClasses = (color, type = 'bg') => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700'
      }
    };
    
    return colors[color]?.[type] || colors.blue[type];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-8 mb-8 border border-blue-200"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4"
        >
          <FaCheckCircle className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to SmartClinicHub! 🎉
        </h2>
        <p className="text-lg text-gray-600">
          Let's get you started on your health journey. Here are some quick steps to make the most of your account:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (index * 0.1) }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${getColorClasses(step.color, 'bg')}`}>
              <div className={getColorClasses(step.color, 'text')}>
                {step.icon}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {step.description}
            </p>
            <Button
              className={`w-full text-sm ${getColorClasses(step.color, 'button')}`}
              size="sm"
            >
              {step.action} <FaArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
        >
          Let's Get Started!
        </Button>
        <button
          onClick={onSkip}
          className="text-gray-600 hover:text-gray-800 underline text-sm font-medium"
        >
          Skip for now, I'll explore on my own
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">
              Your Privacy Matters
            </h4>
            <p className="text-xs text-blue-700">
              All your health information is encrypted and secure. We follow strict HIPAA compliance 
              standards to protect your privacy and ensure your data remains confidential.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PatientOnboarding;
