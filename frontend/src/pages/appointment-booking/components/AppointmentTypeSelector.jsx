import React from 'react';
import Icon from '../../../components/AppIcon';

const AppointmentTypeSelector = ({ selectedType, onTypeSelect }) => {
  const appointmentTypes = [
    {
      id: 'in-person',
      name: 'In-Person Visit',
      icon: 'User',
      duration: '30-45 minutes',
      description: 'Visit the clinic for comprehensive examination and consultation',
      preparation: `Please arrive 15 minutes early for check-in\nBring your ID and insurance card\nWear comfortable clothing for examination`,
      benefits: ['Physical examination', 'Diagnostic tests available', 'Immediate treatment']
    },
    {
      id: 'telehealth',
      name: 'Telehealth Consultation',
      icon: 'Video',
      duration: '15-30 minutes',
      description: 'Virtual consultation from the comfort of your home',
      preparation: `Ensure stable internet connection\nTest your camera and microphone\nFind a quiet, well-lit space\nHave your medical records ready`,
      benefits: ['No travel required', 'Convenient scheduling', 'Safe during illness']
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Choose Appointment Type</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointmentTypes.map((type) => (
          <div
            key={type.id}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-healthcare hover-scale ${
              selectedType === type.id
                ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-primary/50'
            }`}
            onClick={() => onTypeSelect(type.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon name={type.icon} size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{type.name}</h4>
                  <p className="text-sm text-muted-foreground">{type.duration}</p>
                </div>
              </div>
              {selectedType === type.id && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="Check" size={16} className="text-primary-foreground" />
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">{type.description}</p>

            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Preparation:</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  {type.preparation.split('\n').map((line, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="Circle" size={4} className="mt-1.5 flex-shrink-0" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Benefits:</h5>
                <div className="flex flex-wrap gap-1">
                  {type.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentTypeSelector;