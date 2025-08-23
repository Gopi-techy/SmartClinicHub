import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({ selectedRecords, onBulkDownload, onBulkShare, onBulkDelete, onClearSelection }) => {
  if (selectedRecords.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <Icon name="CheckSquare" size={18} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-primary-foreground/80">
              Choose an action to apply to selected records
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={onBulkDownload}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Download
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconName="Share2"
            iconPosition="left"
            onClick={onBulkShare}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconName="Trash2"
            iconPosition="left"
            onClick={onBulkDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClearSelection}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          />
        </div>
      </div>
    </div>
  );
};

export default BulkActions;