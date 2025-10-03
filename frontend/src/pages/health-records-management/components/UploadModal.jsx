import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadModal = ({ isOpen, onClose, onUpload, isUploading, uploadProgress }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filesWithCategories, setFilesWithCategories] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  const categories = [
    'Lab Results',
    'Prescriptions', 
    'Imaging',
    'Insurance',
    'Personal Notes',
    'Other'
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const detectFileCategory = (fileName, fileType) => {
    const name = fileName.toLowerCase();
    
    if (name.includes('lab') || name.includes('blood') || name.includes('test')) {
      return 'Lab Results';
    }
    if (name.includes('prescription') || name.includes('medication') || name.includes('rx')) {
      return 'Prescriptions';
    }
    if (name.includes('xray') || name.includes('x-ray') || name.includes('mri') || name.includes('scan') || name.includes('ultrasound')) {
      return 'Imaging';
    }
    if (name.includes('insurance') || name.includes('coverage') || name.includes('policy')) {
      return 'Insurance';
    }
    if (fileType.startsWith('image/')) {
      return 'Imaging';
    }
    
    return 'Personal Notes';
  };

  const handleFiles = (files) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10; // Maximum files per upload
    
    setUploadError(null);
    setValidationErrors({});
    
    if (files.length > maxFiles) {
      setUploadError(`Too many files selected. Maximum ${maxFiles} files allowed per upload.`);
      return;
    }
    
    const validFiles = [];
    const errors = {};
    
    files.forEach((file, index) => {
      if (!validTypes.includes(file.type)) {
        errors[index] = `Invalid file type. Supported: PDF, JPG, PNG, DOC, DOCX`;
      } else if (file.size > maxSize) {
        errors[index] = `File too large. Maximum size is 10MB`;
      } else if (file.size === 0) {
        errors[index] = `File is empty`;
      } else {
        validFiles.push(file);
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setUploadError(`${Object.keys(errors).length} file(s) could not be added due to validation errors.`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      const filesWithCats = validFiles.map(file => ({
        file,
        category: detectFileCategory(file.name, file.type),
        description: ''
      }));
      setFilesWithCategories(prev => [...prev, ...filesWithCats]);
    }
  };

  const updateFileCategory = (index, category) => {
    setFilesWithCategories(prev => 
      prev.map((item, i) => i === index ? { ...item, category } : item)
    );
  };

  const updateFileDescription = (index, description) => {
    setFilesWithCategories(prev => 
      prev.map((item, i) => i === index ? { ...item, description } : item)
    );
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilesWithCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (filesWithCategories.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }

    // Validate that all files have categories
    const missingCategories = filesWithCategories.filter(item => !item.category);
    if (missingCategories.length > 0) {
      setUploadError('Please select a category for all files.');
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Add category and description to files
      const filesWithMetadata = filesWithCategories.map(item => {
        const file = item.file;
        file.category = item.category;
        file.description = item.description;
        return file;
      });

      await onUpload(filesWithMetadata);
      
      // Show success message
      setUploadSuccess(true);
      
      // Reset form after a brief delay to show success
      setTimeout(() => {
        setSelectedFiles([]);
        setFilesWithCategories([]);
        setUploadSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      setUploadError(error.message || 'Upload failed. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return 'FileText';
    if (type.includes('image')) return 'Image';
    return 'File';
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setFilesWithCategories([]);
      setUploadError(null);
      setUploadSuccess(false);
      setValidationErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Health Records</h2>
              <p className="text-sm text-gray-500 mt-1">Add files with proper categorization and descriptions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={handleClose}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Display */}
          {uploadError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <Icon name="AlertCircle" size={16} />
                <span className="font-medium">Upload Error</span>
              </div>
              <p className="mt-1 text-sm text-red-700">{uploadError}</p>
            </div>
          )}
          
          {/* Success Display */}
          {uploadSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <Icon name="CheckCircle" size={16} />
                <span className="font-medium">Upload Successful!</span>
              </div>
              <p className="mt-1 text-sm text-green-700">Your health records have been uploaded successfully.</p>
            </div>
          )}
          {selectedFiles.length === 0 ? (
            /* Upload Zone */
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <Icon name="Upload" size={32} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select files to upload</h3>
                  <p className="text-gray-500 mb-4">
                    Drag and drop files here, or click to browse
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="default"
                      iconName="Upload"
                      iconPosition="left"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </Button>
                    <Button
                      variant="outline"
                      iconName="Camera"
                      iconPosition="left"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* Files List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Review Files ({selectedFiles.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add More
                </Button>
              </div>

              <div className="space-y-3">
                {filesWithCategories.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      {/* File Icon */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name={getFileIcon(item.file.type)} size={20} className="text-gray-500" />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.file.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatFileSize(item.file.size)} • {item.file.type.split('/')[1].toUpperCase()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="X"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500"
                          />
                        </div>

                        {/* Category Selection */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Category *
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) => updateFileCategory(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateFileDescription(index, e.target.value)}
                              placeholder="Brief description..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Uploading files...</span>
                    <span className="text-sm text-blue-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Type Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Supported File Types</h4>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                <Icon name="FileText" size={12} className="mr-1" />
                PDF
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                <Icon name="Image" size={12} className="mr-1" />
                JPG, PNG
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                <Icon name="File" size={12} className="mr-1" />
                DOC, DOCX
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Maximum file size: 10MB per file
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedFiles.length > 0 && (
                <>
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                iconName={isUploading ? "Clock" : "Upload"}
                iconPosition="left"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;