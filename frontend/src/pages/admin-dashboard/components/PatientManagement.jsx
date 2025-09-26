import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use the existing user management API with role filter and high limit to get all patients
      const response = await fetch('/api/users?role=patient&limit=1000', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match our component expectations
        const transformedPatients = data.data?.users?.map(patient => ({
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          email: patient.email,
          phone: patient.phone || 'N/A',
          gender: patient.gender || 'N/A',
          dateOfBirth: patient.dateOfBirth,
          status: patient.isActive ? 'active' : 'inactive',
          lastActive: patient.lastLogin || patient.createdAt,
          registeredDate: patient.createdAt,
          role: 'patient'
        })) || [];
        
        setPatients(transformedPatients);
        setTotalItems(data.data?.pagination?.totalUsers || transformedPatients.length);
      } else {
        throw new Error(data.message || 'Failed to fetch patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.phone.includes(searchQuery);
    return matchesSearch;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  // Client-side pagination
  const totalPages = Math.ceil(sortedPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatients = sortedPatients.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedPatients([]); // Clear selections when changing pages
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === currentPatients.length && currentPatients.length > 0) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(currentPatients.map(patient => patient._id || patient.id));
    }
  };

  const handlePatientAction = (action, patientId) => {
    console.log(`${action} patient:`, patientId);
    // TODO: Implement patient actions (activate, deactivate, etc.)
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return 'ArrowUpDown';
    return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Patient Management</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Patient Management</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPatients} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Patient Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage all registered patients in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {patients.length} Patients
            </span>
            <Button size="sm" iconName="UserPlus">
              Add Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedPatients.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedPatients.length} selected
              </span>
              <Button size="sm" variant="outline" iconName="Mail">
                Send Message
              </Button>
              <Button size="sm" variant="outline" iconName="Download">
                Export
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={selectedPatients.length === currentPatients.length && currentPatients.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-input"
                />
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Name</span>
                  <Icon name={getSortIcon('name')} size={14} />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Email</span>
                  <Icon name={getSortIcon('email')} size={14} />
                </button>
              </th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Gender</th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('lastActive')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Last Active</span>
                  <Icon name={getSortIcon('lastActive')} size={14} />
                </button>
              </th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPatients.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </td>
              </tr>
            ) : (
              currentPatients.map((patient) => (
                <tr key={patient._id || patient.id} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient._id || patient.id)}
                      onChange={() => handleSelectPatient(patient._id || patient.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {patient.profile?.fullName || patient.name || patient.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {patient._id || patient.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">{patient.email}</td>
                  <td className="p-4 text-foreground">
                    {patient.profile?.phone || patient.phone || 'N/A'}
                  </td>
                  <td className="p-4 text-foreground">
                    {patient.profile?.gender || patient.gender || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.isActive ? 'active' : 'inactive')}`}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-foreground">
                    {patient.lastActive ? new Date(patient.lastActive).toLocaleDateString() : 
                     patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePatientAction('view', patient._id || patient.id)}
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePatientAction('edit', patient._id || patient.id)}
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePatientAction('delete', patient._id || patient.id)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-border bg-muted/25">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, sortedPatients.length)} of {sortedPatients.length} patients
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded border text-sm ${
                  currentPage === page 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientManagement;