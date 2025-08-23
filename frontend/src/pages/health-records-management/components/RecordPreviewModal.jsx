import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RecordPreviewModal = ({ record, isOpen, onClose, onDownload, onShare }) => {
  if (!isOpen || !record) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <div className="fixed inset-0 z-1000 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <Icon name="FileText" size={24} className="text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{record.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(record.category)}`}>
                  {record.category}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(record.size)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={() => onDownload(record)}
            >
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Share2"
              iconPosition="left"
              onClick={() => onShare(record)}
            >
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClose}
              className="h-10 w-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Preview Area */}
            <div className="mb-6">
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {record.type === 'image' ? (
                  <Image
                    src={record.thumbnail}
                    alt={record.name}
                    className="w-full h-full object-contain"
                  />
                ) : record.type === 'pdf' ? (
                  <div className="text-center">
                    <Icon name="FileText" size={64} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">PDF Preview</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click download to view full document
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Icon name="File" size={64} className="text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Document Preview</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click download to view full document
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Name:</span>
                    <span className="text-foreground font-medium">{record.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="text-foreground">{formatFileSize(record.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Type:</span>
                    <span className="text-foreground capitalize">{record.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload Date:</span>
                    <span className="text-foreground">
                      {new Date(record.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Sharing & Access</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Privacy:</span>
                    <span className={`font-medium ${record.isShared ? 'text-success' : 'text-muted-foreground'}`}>
                      {record.isShared ? 'Shared' : 'Private'}
                    </span>
                  </div>
                  {record.doctorName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shared with:</span>
                      <span className="text-foreground">Dr. {record.doctorName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sync Status:</span>
                    <div className="flex items-center space-x-1">
                      {record.syncStatus === 'synced' && (
                        <>
                          <Icon name="Check" size={14} className="text-success" />
                          <span className="text-success">Synced</span>
                        </>
                      )}
                      {record.syncStatus === 'pending' && (
                        <>
                          <Icon name="Clock" size={14} className="text-warning" />
                          <span className="text-warning">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {record.notes && (
              <div className="mt-6">
                <h3 className="font-semibold text-foreground mb-2">Notes</h3>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-foreground">{record.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordPreviewModal;