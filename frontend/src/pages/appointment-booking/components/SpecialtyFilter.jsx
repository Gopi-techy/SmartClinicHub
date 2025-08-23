import React from 'react';
import Icon from '../../../components/AppIcon';

const SpecialtyFilter = ({ specialties, selectedSpecialty, onSpecialtyChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-foreground">Filter by Specialty</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <button
          onClick={() => onSpecialtyChange('all')}
          className={`p-3 rounded-lg border text-sm font-medium transition-healthcare ${
            selectedSpecialty === 'all' ?'border-primary bg-primary text-primary-foreground' :'border-border bg-card text-foreground hover:border-primary/50'
          }`}
        >
          <div className="flex flex-col items-center space-y-1">
            <Icon name="Grid3X3" size={20} />
            <span>All</span>
          </div>
        </button>
        
        {specialties.map((specialty) => (
          <button
            key={specialty.id}
            onClick={() => onSpecialtyChange(specialty.id)}
            className={`p-3 rounded-lg border text-sm font-medium transition-healthcare ${
              selectedSpecialty === specialty.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <Icon name={specialty.icon} size={20} />
              <span className="text-center leading-tight">{specialty.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpecialtyFilter;