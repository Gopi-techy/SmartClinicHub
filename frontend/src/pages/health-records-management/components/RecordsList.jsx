import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecordsList = ({ records, onShare, onDownload, onDelete, onPreview, selectedRecords, onSelectRecord }) => {
  // Helper to get the correct upload date
  const getUploadDate = (record) => {
    // Try s3Files first (if file was uploaded)
    if (record.s3Files && record.s3Files.length > 0 && record.s3Files[0].uploadDate) {
      return record.s3Files[0].uploadDate;
    }
    // Fall back to recordDate
    if (record.recordDate) {
      return record.recordDate;
    }
    // Fall back to createdAt
    if (record.createdAt) {
      return record.createdAt;
    }
    // Fall back to uploadDate (legacy)
    if (record.uploadDate) {
      return record.uploadDate;
    }
    // Default to current date if nothing found
    return new Date();
  };

  // Helper to format date safely
  const formatDate = (dateValue) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Recently uploaded';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently uploaded';
    }
  };

  // Helper to format time safely
  const formatTime = (dateValue) => {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };
  const getCategoryColor = (category) => {
    const colors = {
      'Lab Results': 'text-blue-600',
      'Prescriptions': 'text-green-600',
      'Imaging': 'text-purple-600',
      'Insurance': 'text-orange-600',
      'Personal Notes': 'text-gray-600'
    };
    return colors[category] || 'text-gray-600';
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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted px-4 py-3 border-b border-border">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
          <div className="col-span-1">
            <input
              type="checkbox"
              className="rounded border-border"
              onChange={(e) => {
                if (e.target.checked) {
                  records.forEach(record => onSelectRecord(record._id || record.id, true));
                } else {
                  records.forEach(record => onSelectRecord(record._id || record.id, false));
                }
              }}
            />
          </div>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {records.map((record) => (
          <div key={record._id || record.id} className="px-4 py-3 hover:bg-muted/50 transition-healthcare">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Checkbox */}
              <div className="col-span-1">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={selectedRecords.includes(record._id || record.id)}
                  onChange={(e) => onSelectRecord(record._id || record.id, e.target.checked)}
                />
              </div>

              {/* Name */}
              <div className="col-span-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Icon name={getFileIcon(record.type)} size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{record.s3Files?.[0]?.name || record.name || 'Health Record'}</div>
                    {record.doctorName && (
                      <div className="text-xs text-muted-foreground">Shared with Dr. {record.doctorName}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="col-span-2">
                <span className={`text-sm font-medium ${getCategoryColor(record.s3Files?.[0]?.category || record.category || 'Other')}`}>
                  {record.s3Files?.[0]?.category || record.category || 'Other'}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-2">
                <div className="text-sm text-foreground">
                  {formatDate(getUploadDate(record))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(getUploadDate(record))}
                </div>
              </div>

              {/* Size */}
              <div className="col-span-1">
                <span className="text-sm text-muted-foreground">
                  {formatFileSize(record.s3Files?.[0]?.size || record.size || 0)}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-1">
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

              {/* Actions */}
              <div className="col-span-1">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Eye"
                    onClick={() => onPreview(record)}
                    className="h-8 w-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Download"
                    onClick={() => onDownload(record)}
                    className="h-8 w-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Share2"
                    onClick={() => onShare(record)}
                    className="h-8 w-8"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordsList;