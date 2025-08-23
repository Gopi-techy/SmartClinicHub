import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange, recordCounts }) => {
  const categoryIcons = {
    'All': 'Folder',
    'Lab Results': 'TestTube',
    'Prescriptions': 'Pill',
    'Imaging': 'Scan',
    'Insurance': 'Shield',
    'Personal Notes': 'FileText'
  };

  const categoryColors = {
    'All': 'text-foreground',
    'Lab Results': 'text-blue-600',
    'Prescriptions': 'text-green-600',
    'Imaging': 'text-purple-600',
    'Insurance': 'text-orange-600',
    'Personal Notes': 'text-gray-600'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-4">Categories</h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-healthcare text-left ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon
                name={categoryIcons[category]}
                size={18}
                className={selectedCategory === category ? 'text-primary-foreground' : categoryColors[category]}
              />
              <span className="font-medium">{category}</span>
            </div>
            <span className={`text-sm px-2 py-1 rounded-full ${
              selectedCategory === category
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {recordCounts[category] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="font-medium text-foreground mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button
            variant="ghost"
            fullWidth
            iconName="Download"
            iconPosition="left"
            className="justify-start text-sm"
          >
            Export All Records
          </Button>
          <Button
            variant="ghost"
            fullWidth
            iconName="Share2"
            iconPosition="left"
            className="justify-start text-sm"
          >
            Share with Doctor
          </Button>
          <Button
            variant="ghost"
            fullWidth
            iconName="Archive"
            iconPosition="left"
            className="justify-start text-sm"
          >
            Archive Old Records
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;