import React from 'react';
import Icon from '../../../components/AppIcon';

const BookingProgressIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    { id: 1, title: 'Select Provider', icon: 'UserCheck' },
    { id: 2, title: 'Choose Date & Time', icon: 'Calendar' },
    { id: 3, title: 'Appointment Type', icon: 'Settings' },
    { id: 4, title: 'Confirmation', icon: 'CheckCircle' }
  ];

  return (
    <div className="w-full bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Mobile Progress Bar */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <h3 className="font-medium text-foreground">{steps[currentStep - 1]?.title}</h3>
          </div>
        </div>

        {/* Desktop Step Indicator */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-healthcare ${
                    currentStep > step.id
                      ? 'bg-success text-success-foreground'
                      : currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Icon name="Check" size={20} />
                  ) : (
                    <Icon name={step.icon} size={20} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-healthcare ${
                    currentStep > step.id ? 'bg-success' : 'bg-muted'
                  }`}
                  style={{ minWidth: '60px' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingProgressIndicator;