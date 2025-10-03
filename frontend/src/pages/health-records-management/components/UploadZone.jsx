import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadZone = ({ onFileUpload, isUploading, uploadProgress }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-healthcare ${
          isDragOver
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Upload" size={32} className="text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Uploading Files...</h3>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Icon name="Upload" size={32} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Upload Health Records</h3>
              <p className="text-muted-foreground mb-4">
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
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File Type Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <Icon name="FileText" size={12} className="mr-1" />
            PDF
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <Icon name="Image" size={12} className="mr-1" />
            Images
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            <Icon name="File" size={12} className="mr-1" />
            Documents
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;