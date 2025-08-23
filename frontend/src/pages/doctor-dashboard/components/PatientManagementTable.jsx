import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PatientManagementTable = ({ patients, onPatientSelect, onCreatePrescription }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'appointmentTime', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           patient.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortConfig.key) {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [patients, sortConfig, searchQuery, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-warning text-warning-foreground';
      case 'in-progress':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return { icon: 'AlertTriangle', color: 'text-error' };
      case 'medium':
        return { icon: 'Clock', color: 'text-warning' };
      case 'low':
        return { icon: 'Minus', color: 'text-muted-foreground' };
      default:
        return { icon: 'Minus', color: 'text-muted-foreground' };
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return 'ArrowUpDown';
    }
    return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="Users" size={24} className="mr-2 text-primary" />
          Patient Management
        </h2>
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedPatients.length} of {patients.length} patients
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search patients by name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'waiting', 'in-progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </Button>
          ))}
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
                  onClick={() => handleSort('appointmentTime')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Time</span>
                  <Icon name={getSortIcon('appointmentTime')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('reason')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Visit Reason</span>
                  <Icon name={getSortIcon('reason')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">Priority</th>
              <th className="text-right py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No patients found matching your criteria</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedPatients.map((patient) => {
                const priority = getPriorityIcon(patient.priority);
                return (
                  <tr
                    key={patient.id}
                    className="border-b border-border hover:bg-muted/50 transition-healthcare cursor-pointer"
                    onClick={() => onPatientSelect(patient)}
                  >
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {patient.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm">
                        <div className="font-medium text-foreground">{patient.appointmentTime}</div>
                        <div className="text-muted-foreground">{patient.duration} min</div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm text-foreground">{patient.reason}</div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <Icon name={priority.icon} size={16} className={priority.color} />
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="FileText"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPatientSelect(patient);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="Pill"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreatePrescription(patient);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName="MessageSquare"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagementTable;