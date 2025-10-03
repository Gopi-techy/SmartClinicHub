import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import RecordCard from './components/RecordCard';
import RecordsList from './components/RecordsList';
import UploadZone from './components/UploadZone';
import CategoryFilter from './components/CategoryFilter';
import SearchAndFilters from './components/SearchAndFilters';
import RecordPreviewModal from './components/RecordPreviewModal';
import BulkActions from './components/BulkActions';
import MedicalChatContainer from '../../components/ui/MedicalChatContainer';

const HealthRecordsManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState('patient');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Health records state for AWS S3 integration
  const [healthRecords, setHealthRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const categories = ['All', 'Lab Results', 'Prescriptions', 'Imaging', 'Insurance', 'Personal Notes'];

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    
    const role = user.role || 'patient';
    setUserRole(role);
    
    // Fetch records when component mounts
    fetchHealthRecords();
  }, [isAuthenticated, user, navigate]);

  // Fetch health records from AWS S3
  const fetchHealthRecords = async () => {
    try {
      setIsLoadingRecords(true);
      setRecordsError(null);
      
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated');
      }

      // Get user info from AuthContext
      const userId = user.id || user._id;
      const userRole = user.role;
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        throw new Error('Missing user data or authentication token');
      }

      // Import and use the health records service
      const { default: healthRecordsService } = await import('../../services/healthRecordsService');
      
      // Build filters object
      const filters = {
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        dateRange: dateRange !== 'all' ? dateRange : undefined,
        sortBy,
        search: searchQuery || undefined
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });
      
      const result = await healthRecordsService.fetchRecords(userId, userRole, filters);
      
      if (result.success) {
        setHealthRecords(result.records || []);
        setTotalRecords(result.total || 0);
      } else {
        // Fallback to mock data if service fails
        const mockRecords = [
          {
            id: '1',
            name: 'Blood Test Results.pdf',
            type: 'pdf',
            size: 256000,
            category: 'Lab Results',
            uploadDate: new Date().toISOString(),
            description: 'Complete blood count results',
            doctorName: 'Smith'
          },
          {
            id: '2',
            name: 'X-Ray Chest.jpg',
            type: 'image',
            size: 512000,
            category: 'Imaging',
            uploadDate: new Date(Date.now() - 86400000).toISOString(),
            description: 'Chest X-ray scan',
            doctorName: 'Johnson'
          }
        ];

        setHealthRecords(mockRecords);
        setTotalRecords(mockRecords.length);
        console.warn('Using mock data as fallback:', result.error);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
      setRecordsError(error.message);
      setHealthRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Calculate record counts by category
  const recordCounts = categories.reduce((counts, category) => {
    if (category === 'All') {
      counts[category] = healthRecords.length;
    } else {
      counts[category] = healthRecords.filter(record => record.category === category).length;
    }
    return counts;
  }, {});

  // Filter and sort records
  const filteredRecords = healthRecords
    .filter(record => {
      if (selectedCategory !== 'All' && record.category !== selectedCategory) return false;
      if (searchQuery && !record.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.uploadDate) - new Date(a.uploadDate);
        case 'date-asc':
          return new Date(a.uploadDate) - new Date(b.uploadDate);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return b.size - a.size;
        case 'size-asc':
          return a.size - b.size;
        default:
          return 0;
      }
    });

  // Enhanced file upload with AWS S3 integration
  const handleFileUpload = async (files) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // For doctors, they might be adding records for a specific patient
      const targetPatientId = userRole === 'doctor' ? 
        new URLSearchParams(window.location.search).get('patientId') || userId : 
        userId;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        
        // Add file and metadata
        formData.append('file', file);
        formData.append('userId', targetPatientId);
        formData.append('uploadedBy', userId);
        formData.append('uploaderRole', userRole);
        formData.append('category', detectFileCategory(file.name, file.type));
        formData.append('originalName', file.name);

        // Upload to AWS S3 via backend API
        const response = await fetch('/api/health-records/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Update progress for multiple files
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Refresh records after upload
      await fetchHealthRecords();
      
      // Show success message
      console.log('Files uploaded successfully');
      
    } catch (error) {
      console.error('Upload error:', error);
      setRecordsError(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Detect file category based on name and type
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

  const handlePreview = (record) => {
    setPreviewRecord(record);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (record) => {
    try {
      const response = await fetch(`/api/health-records/${record.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download record');
      }
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setRecordsError(`Download failed: ${error.message}`);
    }
  };

  const handleShare = (record) => {
    // For patients: share with doctors
    // For doctors: already have access, can share with other doctors or export
    console.log('Sharing record:', record.name);
    // Implement share logic - could open a modal to select recipients
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/health-records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      
      // Refresh records after deletion
      await fetchHealthRecords();
    } catch (error) {
      console.error('Delete error:', error);
      setRecordsError(`Delete failed: ${error.message}`);
    }
  };

  const handleRecordSelect = (recordId) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleBulkDownload = async () => {
    try {
      const response = await fetch('/api/health-records/bulk-download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recordIds: selectedRecords })
      });
      
      if (!response.ok) {
        throw new Error('Failed to download records');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'health-records.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSelectedRecords([]);
    } catch (error) {
      console.error('Bulk download error:', error);
      setRecordsError(`Bulk download failed: ${error.message}`);
    }
  };

  const handleBulkShare = () => {
    console.log('Bulk sharing records:', selectedRecords);
    // Implement bulk share logic - open modal to select recipients
    setSelectedRecords([]);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} records?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/health-records/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recordIds: selectedRecords })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete records');
      }
      
      await fetchHealthRecords();
      setSelectedRecords([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      setRecordsError(`Bulk delete failed: ${error.message}`);
    }
  };

  // Check if user can add records
  const canAddRecords = () => {
    if (userRole === 'patient') return true;
    if (userRole === 'doctor') return true; // Doctors can add records for patients
    return userRole === 'admin';
  };

  // Get appropriate permissions text
  const getPermissionsText = () => {
    if (userRole === 'patient') {
      return 'Manage your personal health records';
    }
    if (userRole === 'doctor') {
      return 'View patient records and add new medical documents';
    }
    return 'Full access to health records management';
  };

  const getLayoutClasses = () => {
    if (userRole === 'patient') {
      return 'pt-16 pb-20 md:pb-4 md:pl-64';
    }
    return 'pt-16 md:pl-80';
  };

  return (
    <>
      <Helmet>
        <title>Health Records - SmartClinicHub</title>
        <meta name="description" content="Manage your health records at SmartClinicHub. View medical history, upload documents, track prescriptions, and access your complete healthcare information." />
        <meta name="keywords" content="health records, medical history, healthcare documents, prescriptions, medical files, patient records" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
      
      {userRole === 'patient' && <PatientBottomTabs />}
      {userRole === 'patient' && <PatientSidebar />}
      {(userRole === 'doctor' || userRole === 'admin') && <ProviderSidebar />}

      <main className={getLayoutClasses()}>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Health Records</h1>
                <p className="text-muted-foreground mt-1">
                  {getPermissionsText()}
                </p>
              </div>
              
              {canAddRecords() && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    iconName="Download"
                    iconPosition="left"
                    onClick={handleBulkDownload}
                    disabled={healthRecords.length === 0}
                  >
                    Export All
                  </Button>
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                    disabled={isUploading}
                  >
                    {userRole === 'doctor' ? 'Add Patient Record' : 'Add Record'}
                  </Button>
                </div>
              )}
            </div>
            
            {/* Error Display */}
            {recordsError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <Icon name="AlertCircle" size={16} />
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-1 text-sm text-red-700">{recordsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRecordsError(null);
                    fetchHealthRecords();
                  }}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Upload Zone - only show if user can add records */}
          {canAddRecords() && (
            <div className="mb-6">
              <UploadZone
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            </div>
          )}

          {/* Search and Filters */}
          {!isLoadingRecords && healthRecords.length > 0 && (
            <div className="mb-6">
              <SearchAndFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          )}

          {/* Bulk Actions */}
          <BulkActions
            selectedRecords={selectedRecords}
            onBulkDownload={handleBulkDownload}
            onBulkShare={handleBulkShare}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedRecords([])}
          />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Categories (Desktop) */}
            {!isLoadingRecords && healthRecords.length > 0 && (
              <div className="hidden lg:block">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  recordCounts={recordCounts}
                />
              </div>
            )}

            {/* Records Content */}
            <div className={`${!isLoadingRecords && healthRecords.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              {/* Loading State */}
              {isLoadingRecords ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Loading Health Records</h3>
                  <p className="text-muted-foreground">Fetching your medical documents...</p>
                </div>
              ) : (
                <>
                  {/* Mobile Category Filter */}
                  {healthRecords.length > 0 && (
                    <div className="lg:hidden mb-4">
                      <div className="flex overflow-x-auto space-x-2 pb-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-healthcare ${
                              selectedCategory === category
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {category} ({recordCounts[category] || 0})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Records Display */}
                  {filteredRecords.length > 0 ? (
                    <>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredRecords.map((record) => (
                            <RecordCard
                              key={record.id}
                              record={record}
                              onShare={handleShare}
                              onDownload={handleDownload}
                              onDelete={handleDelete}
                              onPreview={handlePreview}
                            />
                          ))}
                        </div>
                      ) : (
                        <RecordsList
                          records={filteredRecords}
                          onShare={handleShare}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                          onPreview={handlePreview}
                          selectedRecords={selectedRecords}
                          onSelectRecord={handleRecordSelect}
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                        <Icon name="FileText" size={32} className="text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {searchQuery || selectedCategory !== 'All' ? 'No Records Found' : 'No Health Records Yet'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery || selectedCategory !== 'All' 
                          ? 'Try adjusting your search or filter criteria' 
                          : userRole === 'doctor'
                            ? 'Upload medical records for your patients or view existing patient records when available'
                            : 'Upload your first health record to get started'
                        }
                      </p>
                      {canAddRecords() && (!searchQuery && selectedCategory === 'All') && (
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => document.querySelector('input[type="file"]')?.click()}
                        >
                          {userRole === 'doctor' ? 'Add Patient Record' : 'Add Your First Record'}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <RecordPreviewModal
        record={previewRecord}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {/* Medical Chat Widget */}
      <MedicalChatContainer />
    </div>
    </>
  );
};

export default HealthRecordsManagement;