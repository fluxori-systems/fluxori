'use client';

import React, { useState, useEffect } from 'react';
import { adminAnalyticsApi } from '@/lib/api';
import { Button, Stack, Group, Text } from '@/lib/ui';
import { toast } from 'react-hot-toast';
import { Organization, CreditAllotment } from '@/lib/api/types/auth';

// CreditAllotment interface is imported from '@/lib/api/types/auth'

export default function AdminCreditsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [creditAllotments, setCreditAllotments] = useState<CreditAllotment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [creditValues, setCreditValues] = useState<Record<string, number>>({});
  
  // Fetch organizations and credit allotments
  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const orgs = await adminAnalyticsApi.getOrganizations();
      setOrganizations(orgs);
      return orgs;
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
      return [] as Organization[];
    }
  };
  
  const fetchCreditAllotments = async () => {
    try {
      const allotments = await adminAnalyticsApi.getCreditAllotments();
      setCreditAllotments(allotments);
    } catch (err) {
      console.error('Error fetching credit allotments:', err);
      setError('Failed to load credit allotments');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      const orgs = await fetchOrganizations();
      await fetchCreditAllotments();
      
      // Initialize credit values
      const initialValues: Record<string, number> = {};
      if (Array.isArray(orgs)) {
        orgs.forEach((org: Organization) => {
          const allotment = creditAllotments.find(a => a.organizationId === org.id);
          initialValues[org.id] = allotment?.monthlyLimit || 0;
        });
      }
      setCreditValues(initialValues);
    };
    
    loadData();
  }, []);
  
  // Update credit values when allotments change
  useEffect(() => {
    const updatedValues: Record<string, number> = { ...creditValues };
    creditAllotments.forEach(allotment => {
      updatedValues[allotment.organizationId] = allotment.monthlyLimit;
    });
    setCreditValues(updatedValues);
  }, [creditAllotments]);
  
  // Handle edit mode toggle
  const handleEditToggle = (orgId: string) => {
    setEditMode(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };
  
  // Handle credit limit change
  const handleCreditChange = (orgId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setCreditValues(prev => ({
      ...prev,
      [orgId]: numValue
    }));
  };
  
  // Save credit limit changes
  const handleSave = async (orgId: string) => {
    try {
      await adminAnalyticsApi.updateCreditAllotment({
        organizationId: orgId,
        monthlyLimit: creditValues[orgId]
      });
      
      // Update local state
      setCreditAllotments(prev => 
        prev.map(allotment => 
          allotment.organizationId === orgId
            ? { ...allotment, monthlyLimit: creditValues[orgId], updatedAt: new Date().toISOString() }
            : allotment
        )
      );
      
      // Exit edit mode
      setEditMode(prev => ({
        ...prev,
        [orgId]: false
      }));
      
      toast.success('Credit limit updated successfully');
    } catch (err) {
      console.error('Error updating credit limit:', err);
      toast.error('Failed to update credit limit');
    }
  };
  
  // Refresh data
  const handleRefresh = async () => {
    await fetchOrganizations();
    await fetchCreditAllotments();
    toast.success('Data refreshed');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 border border-red-200">
        <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Data</h2>
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  // Calculate total credits used and allocated
  const totalCreditsUsed = creditAllotments.reduce((sum, allotment) => sum + allotment.currentUsage, 0);
  const totalCreditsAllocated = creditAllotments.reduce((sum, allotment) => sum + allotment.monthlyLimit, 0);
  
  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString();
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organization Credit Management</h1>
        <Button onClick={handleRefresh}>Refresh Data</Button>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Credits Used</h3>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCreditsUsed)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Credits Allocated</h3>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCreditsAllocated)}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Organizations</h3>
          <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
        </div>
      </div>
      
      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Organizations</h2>
          <p className="mt-1 text-sm text-gray-500">Manage credit allocations for each organization.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Limit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map(org => {
                const allotment = creditAllotments.find(a => a.organizationId === org.id);
                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">ID: {org.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatNumber(allotment?.currentUsage || 0)} credits</div>
                      {allotment && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (allotment.currentUsage / (allotment.monthlyLimit || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editMode[org.id] ? (
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={creditValues[org.id] || 0}
                          onChange={(e) => handleCreditChange(org.id, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{formatNumber(allotment?.monthlyLimit || 0)} credits</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {allotment?.lastUpdated 
                          ? new Date(allotment.lastUpdated).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editMode[org.id] ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(org.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleEditToggle(org.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditToggle(org.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit Limit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Usage Trends */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Credit Usage Trends</h2>
        <p className="text-gray-500 text-sm">
          This feature will show credit usage trends over time for all organizations.
          Charts and analysis will be available in a future update.
        </p>
      </div>
    </div>
  );
}