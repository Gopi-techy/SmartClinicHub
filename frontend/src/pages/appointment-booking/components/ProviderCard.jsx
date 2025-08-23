import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';


const ProviderCard = ({ provider, isSelected, onSelect }) => {
  const formatNextAvailable = (date) => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const diffTime = appointmentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return appointmentDate.toLocaleDateString();
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="Star"
        size={16}
        className={index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-healthcare hover-scale ${
        isSelected
          ? 'border-primary bg-primary/5' :'border-border bg-card hover:border-primary/50'
      }`}
      onClick={() => onSelect(provider)}
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <Image
            src={provider.image}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          {provider.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground truncate">{provider.name}</h3>
              <p className="text-sm text-muted-foreground">{provider.specialty}</p>
              <p className="text-xs text-muted-foreground">{provider.hospital}</p>
            </div>
            {isSelected && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Icon name="Check" size={16} className="text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <div className="flex items-center space-x-1">
              {renderStars(provider.rating)}
            </div>
            <span className="text-sm font-medium">{provider.rating}</span>
            <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{provider.experience} exp</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="DollarSign" size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">${provider.consultationFee}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next available</p>
              <p className="text-sm font-medium text-success">
                {formatNextAvailable(provider.nextAvailable)}
              </p>
            </div>
          </div>

          {provider.specializations && provider.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.specializations.slice(0, 3).map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded-full"
                >
                  {spec}
                </span>
              ))}
              {provider.specializations.length > 3 && (
                <span className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded-full">
                  +{provider.specializations.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;