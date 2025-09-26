import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AllPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    fetchAllPatients();
  }, []);

  const fetchAllPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/appointments/doctor/all-patients', {
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
        const transformedPatients = data.patients?.map(patient => ({
          id: patient.id,
          name: patient.name,
          email: patient.patient?.email || 'N/A',
          phone: patient.patient?.phone || 'N/A',
          gender: patient.patient?.gender || 'N/A',
          registeredDate: patient.patient?.registeredDate || new Date().toISOString(),
          status: 'Registered'
        })) || [];
        
        setPatients(transformedPatients);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return 'ArrowUpDown';
    }
    return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  // Filter and sort patients
  const filteredAndSortedPatients = patients
    .filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Patients</h2>
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
          <h2 className="text-xl font-semibold text-gray-900">All Patients</h2>
        </div>
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAllPatients} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">All Patients</h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            All Registered Patients
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Patient Name</span>
                  <Icon name={getSortIcon('name')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Email</span>
                  <Icon name={getSortIcon('email')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('phone')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Phone</span>
                  <Icon name={getSortIcon('phone')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('gender')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Gender</span>
                  <Icon name={getSortIcon('gender')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('registeredDate')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Registered</span>
                  <Icon name={getSortIcon('registeredDate')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">Status</th>
              <th className="text-right py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPatients.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {patient.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-foreground">{patient.email}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-foreground">{patient.phone}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-foreground">{patient.gender}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-foreground">
                      {new Date(patient.registeredDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => {
                          // TODO: View patient details
                          console.log('View patient:', patient.id);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="MessageCircle"
                        onClick={() => {
                          // TODO: Message patient
                          console.log('Message patient:', patient.id);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredAndSortedPatients.length} of {patients.length} patients
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
};

export default AllPatients;