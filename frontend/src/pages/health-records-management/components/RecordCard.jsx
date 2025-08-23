import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RecordCard = ({ record, onShare, onDownload, onDelete, onPreview }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getCategoryColor = (category) => {
    const colors = {
      'Lab Results': 'bg-blue-100 text-blue-800',
      'Prescriptions': 'bg-green-100 text-green-800',
      'Imaging': 'bg-purple-100 text-purple-800',
      'Insurance': 'bg-orange-100 text-orange-800',
      'Personal Notes': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getFileIcon = (type) => {
    const icons = {
      'pdf': 'FileText',
      'image': 'Image',
      'document': 'File'
    };
    return icons[type] || 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-healthcare-lg transition-healthcare">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <Icon name={getFileIcon(record.type)} size={20} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{record.name}</h3>
            <p className="text-sm text-muted-foreground">{formatFileSize(record.size)}</p>
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            iconName="MoreVertical"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-8 w-8"
          />
          
          {isMenuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onPreview(record);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center space-x-2"
                >
                  <Icon name="Eye" size={16} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    onDownload(record);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center space-x-2"
                >
                  <Icon name="Download" size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    onShare(record);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center space-x-2"
                >
                  <Icon name="Share2" size={16} />
                  <span>Share</span>
                </button>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={() => {
                    onDelete(record);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-destructive flex items-center space-x-2"
                >
                  <Icon name="Trash2" size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="mb-3">
        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {record.type === 'image' ? (
            <Image
              src={record.thumbnail}
              alt={record.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon name={getFileIcon(record.type)} size={32} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(record.category)}`}>
            {record.category}
          </span>
          <div className="flex items-center space-x-1">
            {record.isShared && (
              <Icon name="Users" size={14} className="text-success" />
            )}
            {record.syncStatus === 'synced' && (
              <Icon name="Check" size={14} className="text-success" />
            )}
            {record.syncStatus === 'pending' && (
              <Icon name="Clock" size={14} className="text-warning" />
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <div>Uploaded: {new Date(record.uploadDate).toLocaleDateString()}</div>
          {record.doctorName && (
            <div>Shared with: Dr. {record.doctorName}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordCard;