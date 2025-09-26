import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use the existing user management API with role filter
      const response = await fetch('/api/users?role=doctor', {
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
        const transformedDoctors = data.data?.users?.map(doctor => ({
          id: doctor._id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          email: doctor.email,
          phone: doctor.phone || 'N/A',
          specialization: doctor.professionalInfo?.specialization || 'Not specified',
          experience: doctor.professionalInfo?.experience || 'N/A',
          licenseNumber: doctor.professionalInfo?.licenseNumber || 'N/A',
          verificationStatus: doctor.verificationStatus || 'unverified',
          status: doctor.isActive ? 'active' : 'inactive',
          lastActive: doctor.lastLogin || doctor.createdAt,
          registeredDate: doctor.createdAt,
          role: 'doctor'
        })) || [];
        
        setDoctors(transformedDoctors);
      } else {
        throw new Error(data.message || 'Failed to fetch doctors');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.phone.includes(searchQuery);
    return matchesSearch;
  });

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSelectDoctor = (doctorId) => {
    setSelectedDoctors(prev => 
      prev.includes(doctorId) 
        ? prev.filter(id => id !== doctorId)
        : [...prev, doctorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDoctors.length === sortedDoctors.length) {
      setSelectedDoctors([]);
    } else {
      setSelectedDoctors(sortedDoctors.map(doctor => doctor.id));
    }
  };

  const handleDoctorAction = (action, doctorId) => {
    console.log(`${action} doctor:`, doctorId);
    // TODO: Implement doctor actions (verify, suspend, etc.)
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

  const getVerificationColor = (status) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Doctor Management</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading doctors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Doctor Management</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDoctors} variant="outline">
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
            <h2 className="text-xl font-semibold text-foreground">Doctor Management</h2>
            <p className="text-sm text-muted-foreground">
              Manage all registered doctors and their verification status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {doctors.filter(d => d.verificationStatus === 'verified' || d.verificationStatus === 'approved').length} Verified
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {doctors.length} Doctors
            </span>
            <Button size="sm" iconName="UserPlus">
              Add Doctor
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
              placeholder="Search doctors by name, email, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedDoctors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedDoctors.length} selected
              </span>
              <Button size="sm" variant="outline" iconName="Shield">
                Bulk Verify
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
                  checked={selectedDoctors.length === sortedDoctors.length && sortedDoctors.length > 0}
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
              <th className="text-left p-4">Specialization</th>
              <th className="text-left p-4">Experience</th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('verificationStatus')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Verification</span>
                  <Icon name={getSortIcon('verificationStatus')} size={14} />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDoctors.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No doctors found matching your search.' : 'No doctors registered yet.'}
                </td>
              </tr>
            ) : (
              sortedDoctors.map((doctor) => (
                <tr key={doctor.id} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(doctor.id)}
                      onChange={() => handleSelectDoctor(doctor.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="Stethoscope" size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{doctor.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {doctor.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">{doctor.email}</td>
                  <td className="p-4 text-foreground">{doctor.specialization}</td>
                  <td className="p-4 text-foreground">
                    {doctor.experience !== 'N/A' ? `${doctor.experience} years` : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(doctor.verificationStatus)}`}>
                      {doctor.verificationStatus.charAt(0).toUpperCase() + doctor.verificationStatus.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doctor.status)}`}>
                      {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        iconName="Eye"
                        onClick={() => handleDoctorAction('view', doctor.id)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconName="Shield"
                        onClick={() => handleDoctorAction('verify', doctor.id)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconName="Edit"
                        onClick={() => handleDoctorAction('edit', doctor.id)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconName="MoreHorizontal"
                        onClick={() => handleDoctorAction('more', doctor.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/25">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {sortedDoctors.length} of {doctors.length} doctors
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
            <span className="px-3 py-1 bg-background rounded border">1</span>
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorManagement;