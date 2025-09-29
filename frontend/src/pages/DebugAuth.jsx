import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Authentication Debug</h1>
        
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Current Auth State</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-foreground">Is Authenticated:</label>
              <p className={`text-lg ${auth.isAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
                {auth.isAuthenticated ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <label className="font-medium text-foreground">Is Loading:</label>
              <p className={`text-lg ${auth.isLoading ? 'text-yellow-500' : 'text-gray-500'}`}>
                {auth.isLoading ? 'Yes' : 'No'}
              </p>
            </div>
            
            <div>
              <label className="font-medium text-foreground">User Role:</label>
              <p className="text-lg text-foreground">{auth.userRole || 'None'}</p>
            </div>
            
            <div>
              <label className="font-medium text-foreground">Token Exists:</label>
              <p className={`text-lg ${auth.token ? 'text-green-500' : 'text-red-500'}`}>
                {auth.token ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          
          {auth.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-medium text-destructive mb-2">Error:</h3>
              <p className="text-destructive">{auth.error}</p>
            </div>
          )}
          
          {auth.user && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">User Data:</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(auth.user, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">LocalStorage Data:</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">authToken:</span>
                <span className="ml-2">{localStorage.getItem('authToken') ? 'Present' : 'Missing'}</span>
              </div>
              <div>
                <span className="font-medium">userRole:</span>
                <span className="ml-2">{localStorage.getItem('userRole') || 'None'}</span>
              </div>
              <div>
                <span className="font-medium">userEmail:</span>
                <span className="ml-2">{localStorage.getItem('userEmail') || 'None'}</span>
              </div>
              <div>
                <span className="font-medium">userName:</span>
                <span className="ml-2">{localStorage.getItem('userName') || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = '/login-registration'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Go to Login
            </button>
            <button
              onClick={() => auth.logout()}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
            >
              Logout
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
        
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Test Role Access</h2>
          <div className="space-y-2">
            <a 
              href="/patient-dashboard" 
              className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Patient Dashboard
            </a>
            <a 
              href="/doctor-dashboard" 
              className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Doctor Dashboard
            </a>
            <a 
              href="/admin-dashboard" 
              className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;