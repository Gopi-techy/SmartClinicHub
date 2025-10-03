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
    <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
      {/* Header with improved layout */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center shadow-sm">
              <Icon name={getFileIcon(record.type)} size={24} className="text-gray-500" />
            </div>
            {record.syncStatus === 'synced' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Icon name="Check" size={12} className="text-white" />
              </div>
            )}
            {record.syncStatus === 'pending' && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Icon name="Clock" size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base leading-tight">{record.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{formatFileSize(record.size)}</p>
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            iconName="MoreVertical"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
          />
          
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-9 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={() => {
                      onPreview(record);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <Icon name="Eye" size={16} className="text-gray-500" />
                    <span className="text-gray-700">Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      onDownload(record);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <Icon name="Download" size={16} className="text-gray-500" />
                    <span className="text-gray-700">Download</span>
                  </button>
                  <button
                    onClick={() => {
                      onShare(record);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <Icon name="Share2" size={16} className="text-gray-500" />
                    <span className="text-gray-700">Share</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      onDelete(record);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-3 transition-colors"
                  >
                    <Icon name="Trash2" size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Preview Section */}
      <div className="mb-4">
        <div 
          className="w-full h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-300"
          onClick={() => onPreview(record)}
        >
          {record.type === 'image' ? (
            <Image
              src={record.thumbnail}
              alt={record.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Icon name={getFileIcon(record.type)} size={40} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Click to preview</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Metadata Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getCategoryColor(record.category)}`}>
            {record.category}
          </span>
          <div className="flex items-center space-x-2">
            {record.isShared && (
              <div className="flex items-center space-x-1">
                <Icon name="Users" size={14} className="text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">Shared</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Uploaded:</span>
            <span className="font-medium text-gray-600">{new Date(record.uploadDate).toLocaleDateString()}</span>
          </div>
          {record.doctorName && (
            <div className="flex items-center justify-between">
              <span>Shared with:</span>
              <span className="font-medium text-gray-600">Dr. {record.doctorName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onPreview(record)}
            className="text-xs text-gray-500 hover:text-primary font-medium transition-colors"
          >
            Preview
          </button>
          <button
            onClick={() => onDownload(record)}
            className="text-xs text-gray-500 hover:text-primary font-medium transition-colors"
          >
            Download
          </button>
        </div>
        <button
          onClick={() => onShare(record)}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Share
        </button>
      </div>
    </div>
  );
};

export default RecordCard;