'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../../api/apiClient';
import { MetricCard } from '../../../../../components/data-visualization/MetricCard';
import { AnimatedLineChart } from '../../../../../components/charts/AnimatedLineChart';
import { Button } from '../../../../../components/ui/Button';
import { CreditPurchasePanel } from '../../../../../components/settings/CreditPurchasePanel';

interface CreditInfo {
  available: number;
  availableChange: number;
  usedThisMonth: number;
  usageChangePercent: number;
  monthlyLimit: number;
}

interface CreditUsage {
  id: string;
  timestamp: string;
  modelName: string;
  feature: string;
  creditsUsed: number;
  status: string;
}

interface UsageData {
  date: string;
  value: number;
  label: string;
}

export default function AICreditsDashboard() {
  const [credits, setCredits] = useState<CreditInfo>({
    available: 0,
    availableChange: 0,
    usedThisMonth: 0,
    usageChangePercent: 0,
    monthlyLimit: 0,
  });
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([]);
  const [usageByDay, setUsageByDay] = useState<UsageData[]>([]);
  const [usageByModel, setUsageByModel] = useState<UsageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch credit data
  const fetchCreditData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch credit information
      const creditInfo = await api.aiCredits.getCreditInfo();
      setCredits(creditInfo);

      // Fetch usage history
      const history = await api.aiCredits.getUsageHistory({ limit: 50 });
      setUsageHistory(history);

      // Fetch usage by day
      const dailyUsage = await api.aiCredits.getUsageByDay({ days: 14 });
      setUsageByDay(dailyUsage.map((item: any) => ({
        date: item.date,
        value: item.creditsUsed,
        label: new Date(item.date).toLocaleDateString(),
      })));

      // Fetch usage by model
      const modelUsage = await api.aiCredits.getUsageByModel();
      setUsageByModel(modelUsage.map((item: any) => ({
        date: item.modelName,
        value: item.creditsUsed,
        label: item.modelName,
      })));

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching credit data:', err);
      setError('Failed to load credit information. Please try again later.');
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCreditData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 border border-red-200">
        <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Credits</h2>
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={fetchCreditData}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Credits Dashboard</h1>
        <Button onClick={fetchCreditData}>Refresh</Button>
      </div>
      
      {/* Credit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Available Credits"
          value={credits.available}
          valueFormatted={`${credits.available.toLocaleString()} credits`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{
            value: credits.availableChange,
            isPositive: credits.availableChange >= 0,
            label: credits.availableChange >= 0 ? 'increase' : 'decrease',
            percentageChange: Math.abs(Math.round((credits.availableChange / (credits.available - credits.availableChange)) * 100)) || 0,
          }}
        />
        
        <MetricCard
          title="Used This Month"
          value={credits.usedThisMonth}
          valueFormatted={`${credits.usedThisMonth.toLocaleString()} credits`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          trend={{
            value: credits.usageChangePercent,
            isPositive: false,
            label: 'from last month',
            percentageChange: Math.abs(credits.usageChangePercent),
          }}
        />
        
        <MetricCard
          title="Monthly Limit"
          value={credits.monthlyLimit}
          valueFormatted={`${credits.monthlyLimit.toLocaleString()} credits`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          trend={{
            value: Math.round((credits.usedThisMonth / credits.monthlyLimit) * 100),
            isPositive: true,
            label: 'used',
            percentageChange: Math.round((credits.usedThisMonth / credits.monthlyLimit) * 100),
          }}
        />
      </div>
      
      {/* Usage Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Daily Usage (Last 14 Days)</h2>
          {usageByDay.length > 0 ? (
            <div className="h-64">
              <AnimatedLineChart
                data={usageByDay}
                xKey="date"
                yKey="value"
                labelKey="label"
                color="#6366f1"
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No usage data available
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Usage by AI Model</h2>
          {usageByModel.length > 0 ? (
            <div className="h-64">
              <AnimatedLineChart
                data={usageByModel}
                xKey="date"
                yKey="value"
                labelKey="label"
                color="#8b5cf6"
                isBar={true}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No model usage data available
            </div>
          )}
        </div>
      </div>
      
      {/* Usage History */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Recent Usage</h2>
        {usageHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.modelName}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.feature}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.creditsUsed}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          item.status === 'failed' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No usage history available
          </div>
        )}
      </div>
      
      {/* Purchase Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium mb-4">Purchase Credits</h2>
        <CreditPurchasePanel onPurchaseComplete={fetchCreditData} />
      </div>
    </div>
  );
}