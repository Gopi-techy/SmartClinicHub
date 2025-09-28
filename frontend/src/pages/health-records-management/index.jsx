import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
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

  // Mock health records data
  const [healthRecords] = useState([
    {
      id: 1,
      name: "Blood Test Results - Complete Panel",
      category: "Lab Results",
      type: "pdf",
      size: 2456789,
      uploadDate: "2025-01-15T10:30:00Z",
      isShared: true,
      doctorName: "Sarah Johnson",
      syncStatus: "synced",
      thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
      notes: "Comprehensive blood panel showing all values within normal range. Cholesterol levels have improved since last test."
    },
    {
      id: 2,
      name: "Chest X-Ray - Annual Checkup",
      category: "Imaging",
      type: "image",
      size: 5234567,
      uploadDate: "2025-01-10T14:15:00Z",
      isShared: true,
      doctorName: "Michael Chen",
      syncStatus: "synced",
      thumbnail: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
      notes: "Clear chest X-ray with no abnormalities detected. Lungs appear healthy and clear."
    },
    {
      id: 3,
      name: "Prescription - Metformin 500mg",
      category: "Prescriptions",
      type: "pdf",
      size: 1234567,
      uploadDate: "2025-01-08T09:45:00Z",
      isShared: false,
      syncStatus: "synced",
      thumbnail: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
      notes: "Diabetes medication prescription. Take twice daily with meals."
    },
    {
      id: 4,
      name: "Insurance Card - Front and Back",
      category: "Insurance",
      type: "image",
      size: 3456789,
      uploadDate: "2025-01-05T16:20:00Z",
      isShared: false,
      syncStatus: "pending",
      thumbnail: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop",
      notes: "Updated insurance card with new policy number and coverage details."
    },
    {
      id: 5,
      name: "Vaccination Record - COVID-19",
      category: "Personal Notes",
      type: "pdf",
      size: 1876543,
      uploadDate: "2025-01-03T11:30:00Z",
      isShared: true,
      doctorName: "Emily Rodriguez",
      syncStatus: "synced",
      thumbnail: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
      notes: "Complete COVID-19 vaccination record including booster shots."
    },
    {
      id: 6,
      name: "MRI Scan - Knee Joint",
      category: "Imaging",
      type: "image",
      size: 8765432,
      uploadDate: "2024-12-28T13:45:00Z",
      isShared: true,
      doctorName: "David Wilson",
      syncStatus: "synced",
      thumbnail: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
      notes: "MRI scan of left knee showing minor cartilage wear consistent with age."
    }
  ]);

  const categories = ['All', 'Lab Results', 'Prescriptions', 'Imaging', 'Insurance', 'Personal Notes'];

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'patient';
    setUserRole(role);
  }, []);

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

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    // Show success message (would integrate with toast system)
    console.log('Files uploaded successfully:', files);
  };

  const handleRecordSelect = (recordId, isSelected) => {
    setSelectedRecords(prev => 
      isSelected 
        ? [...prev, recordId]
        : prev.filter(id => id !== recordId)
    );
  };

  const handlePreview = (record) => {
    setPreviewRecord(record);
    setIsPreviewOpen(true);
  };

  const handleDownload = (record) => {
    console.log('Downloading record:', record.name);
    // Implement download logic
  };

  const handleShare = (record) => {
    console.log('Sharing record:', record.name);
    // Implement share logic
  };

  const handleDelete = (record) => {
    console.log('Deleting record:', record.name);
    // Implement delete logic
  };

  const handleBulkDownload = () => {
    console.log('Bulk downloading records:', selectedRecords);
    setSelectedRecords([]);
  };

  const handleBulkShare = () => {
    console.log('Bulk sharing records:', selectedRecords);
    setSelectedRecords([]);
  };

  const handleBulkDelete = () => {
    console.log('Bulk deleting records:', selectedRecords);
    setSelectedRecords([]);
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
                  Manage and organize your medical documents securely
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  iconName="Download"
                  iconPosition="left"
                  onClick={() => console.log('Export all records')}
                >
                  Export All
                </Button>
                <Button
                  variant="default"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                >
                  Add Record
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="mb-6">
            <UploadZone
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>

          {/* Search and Filters */}
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
            <div className="hidden lg:block">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                recordCounts={recordCounts}
              />
            </div>

            {/* Records Content */}
            <div className="lg:col-span-3">
              {/* Mobile Category Filter */}
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Records Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== 'All' ?'Try adjusting your search or filter criteria' :'Upload your first health record to get started'
                    }
                  </p>
                  <Button
                    variant="default"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                  >
                    Add Your First Record
                  </Button>
                </div>
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