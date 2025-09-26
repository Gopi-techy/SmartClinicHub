import React, { useState, useEffect } from 'react';
import { authService } from '../../../utils/authService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const UserManagementTable = ({ onUserAction }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const roles = ['all', 'patient', 'doctor', 'admin'];

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all users with a high limit to get complete dataset
      const response = await authService.getUsers({ limit: 1000, page: 1 });
      
      if (response.success) {
        setUsers(response.data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const email = user.email || '';
    const role = user.role || '';
    
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;
    
    // Handle special case for name sorting
    if (sortConfig.key === 'name') {
      aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
    } else {
      const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };
      aValue = getNestedValue(a, sortConfig.key) || '';
      bValue = getNestedValue(b, sortConfig.key) || '';
    }
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  // Client-side pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === currentUsers.length && currentUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map(user => user._id));
    }
  };

  const handleBulkAction = async (action) => {
    try {
      // Here you would implement bulk actions
      console.log(`Performing ${action} on users:`, selectedUsers);
      
      for (const userId of selectedUsers) {
        await onUserAction?.(userId, action);
      }
      
      setSelectedUsers([]);
      // Refresh users after action
      await fetchUsers();
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
      setError(`Failed to perform ${action}`);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selections when changing pages
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'patient':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="text-center py-8">
          <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Users</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      {/* Table Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-foreground">User Management</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all system users and their permissions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant="default"
              iconName="UserPlus"
              onClick={() => onUserAction?.('new', 'add-user')}
            >
              Add User
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
          >
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              iconName="UserCheck"
              onClick={() => handleBulkAction('activate')}
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="UserX"
              onClick={() => handleBulkAction('suspend')}
            >
              Suspend
            </Button>
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Name</span>
                  <Icon name={sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} size={16} />
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Email</span>
                  <Icon name={sortConfig.key === 'email' && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} size={16} />
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Role</span>
                  <Icon name={sortConfig.key === 'role' && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} size={16} />
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('isActive')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Status</span>
                  <Icon name={sortConfig.key === 'isActive' && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} size={16} />
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary"
                >
                  <span>Last Active</span>
                  <Icon name={sortConfig.key === 'createdAt' && sortConfig.direction === 'desc' ? 'ChevronDown' : 'ChevronUp'} size={16} />
                </button>
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted-foreground">
                  {searchQuery || filterRole !== 'all' ? 'No users found matching your criteria.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user._id} className="border-b border-border hover:bg-muted/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                        {(user.firstName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user._id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {user.lastActive 
                      ? new Date(user.lastActive).toLocaleDateString() 
                      : user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Eye"
                        onClick={() => onUserAction?.(user._id, 'view')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Edit"
                        onClick={() => onUserAction?.(user._id, 'edit')}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="MoreHorizontal"
                        onClick={() => onUserAction?.(user._id, 'menu')}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length} users
              {searchQuery && ` matching "${searchQuery}"`}
              {filterRole !== 'all' && ` with role "${filterRole}"`}
            </span>
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm bg-background"
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
              iconName="ChevronLeft"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return page <= totalPages ? (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${
                    currentPage === page 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {page}
                </button>
              ) : null;
            })}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              iconName="ChevronRight"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTable;