import React, { useState, useEffect } from 'react';
import { observabilityApi } from '../../api/observability.api';
import { Trace, TraceSpan } from '../../types/observability.types';

interface TraceViewerProps {
  traceId?: string;
  height?: number;
  width?: string;
  onSpanClick?: (span: TraceSpan) => void;
}

/**
 * Component for visualizing distributed trace data
 */
export const TraceViewer: React.FC<TraceViewerProps> = ({
  traceId,
  height = 500,
  width = '100%',
  onSpanClick
}) => {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  
  useEffect(() => {
    if (!traceId) return;
    
    const fetchTrace = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await observabilityApi.getTrace(traceId);
        setTrace(data);
      } catch (err) {
        setError(`Failed to fetch trace: ${traceId}`);
        console.error('Trace fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrace();
  }, [traceId]);
  
  // Format duration to a readable string
  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1) {
      return `${(durationMs * 1000).toFixed(2)}μs`;
    }
    if (durationMs < 1000) {
      return `${durationMs.toFixed(2)}ms`;
    }
    return `${(durationMs / 1000).toFixed(2)}s`;
  };
  
  // Build the span tree structure
  const buildSpanTree = (spans: TraceSpan[], rootSpanId: string): TraceSpan[] => {
    const spanMap = new Map<string, TraceSpan & { children?: TraceSpan[] }>();
    
    // First pass - create map of all spans
    spans.forEach(span => {
      spanMap.set(span.id, { ...span, children: [] });
    });
    
    // Second pass - build the tree
    spans.forEach(span => {
      if (span.parentId && spanMap.has(span.parentId)) {
        const parent = spanMap.get(span.parentId);
        if (parent && parent.children) {
          parent.children.push(spanMap.get(span.id)!);
        }
      }
    });
    
    // Return the root span and its children
    return spanMap.has(rootSpanId) ? [spanMap.get(rootSpanId)!] : [];
  };
  
  // Render a single span in the tree
  const renderSpan = (
    span: TraceSpan & { children?: TraceSpan[] },
    depth = 0,
    maxDuration: number
  ) => {
    if (!span) return null;
    
    // Calculate width percentage based on duration relative to the whole trace
    const widthPercentage = (span.duration / maxDuration) * 100;
    
    // Determine if this span matches the search query
    const matchesSearch = searchQuery && 
      (span.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       span.attributes && JSON.stringify(span.attributes).toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Determine background color based on status and search match
    let backgroundColor = span.status === 'success' ? 'bg-green-100' : 
                          span.status === 'error' ? 'bg-red-100' : 'bg-gray-100';
    
    if (matchesSearch) {
      backgroundColor = 'bg-yellow-200';
    }
    
    if (selectedSpan && selectedSpan.id === span.id) {
      backgroundColor = 'bg-blue-200';
    }
    
    return (
      <div key={span.id} className="mb-2">
        <div 
          className={`flex flex-col px-2 py-1 rounded-md cursor-pointer ${backgroundColor} hover:bg-opacity-80`}
          style={{ 
            marginLeft: `${depth * 20}px`,
            width: `${Math.max(widthPercentage, 10)}%` 
          }}
          onClick={() => {
            setSelectedSpan(span);
            if (onSpanClick) onSpanClick(span);
          }}
        >
          <div className="flex justify-between items-center">
            <div className="font-medium truncate" style={{ maxWidth: '80%' }}>
              {span.name}
            </div>
            <div className="text-xs text-gray-600">
              {formatDuration(span.duration)}
            </div>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {new Date(span.startTime).toLocaleTimeString()}
          </div>
        </div>
        
        {span.children && span.children.length > 0 && (
          <div>
            {span.children.map(child => renderSpan(child, depth + 1, maxDuration))}
          </div>
        )}
      </div>
    );
  };
  
  // Render the span details panel
  const renderSpanDetails = (span: TraceSpan) => {
    return (
      <div className="bg-white rounded-md shadow-sm p-4 mt-4">
        <h3 className="text-lg font-medium mb-2">{span.name}</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">ID</p>
            <p className="font-mono text-xs">{span.id}</p>
          </div>
          {span.parentId && (
            <div>
              <p className="text-sm text-gray-600">Parent ID</p>
              <p className="font-mono text-xs">{span.parentId}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Start Time</p>
            <p className="text-sm">
              {new Date(span.startTime).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Time</p>
            <p className="text-sm">
              {new Date(span.endTime).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-sm">{formatDuration(span.duration)}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <div className={`
            inline-block px-2 py-1 rounded-full text-xs
            ${span.status === 'success' ? 'bg-green-100 text-green-800' : 
             span.status === 'error' ? 'bg-red-100 text-red-800' : 
             'bg-gray-100 text-gray-800'}
          `}>
            {span.status}
          </div>
        </div>
        
        {span.attributes && Object.keys(span.attributes).length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Attributes</p>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(span.attributes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };
  
  if (loading && !trace) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse" style={{ height, width }}>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500" style={{ width }}>
        <h3 className="text-lg font-semibold mb-2">Trace Viewer</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => {
            if (traceId) {
              setLoading(true);
              observabilityApi.getTrace(traceId)
                .then(data => {
                  setTrace(data);
                  setError(null);
                })
                .catch(err => {
                  setError(`Failed to fetch trace: ${traceId}`);
                  console.error('Trace fetch retry failed:', err);
                })
                .finally(() => setLoading(false));
            }
          }}
          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!trace) {
    return (
      <div className="bg-white rounded-lg shadow p-4" style={{ width }}>
        <h3 className="text-lg font-semibold mb-2">Trace Viewer</h3>
        {!traceId ? (
          <p className="text-gray-600">No trace ID provided.</p>
        ) : (
          <p className="text-gray-600">No trace data available.</p>
        )}
      </div>
    );
  }
  
  // Build the span tree for visualization
  const spanTree = buildSpanTree(trace.spans, trace.rootSpan);
  const maxDuration = trace.duration;
  
  return (
    <div className="bg-white rounded-lg shadow p-4" style={{ width, height, overflow: 'auto' }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{trace.name}</h3>
          <p className="text-sm text-gray-600">
            Trace ID: <span className="font-mono">{trace.traceId}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total Duration: {formatDuration(trace.duration)}
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search spans..."
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-3/5 overflow-auto p-2 bg-gray-50 rounded" style={{ maxHeight: height - 130 }}>
          {spanTree.map(span => renderSpan(span, 0, maxDuration))}
        </div>
        
        <div className="md:w-2/5">
          {selectedSpan ? (
            renderSpanDetails(selectedSpan)
          ) : (
            <div className="bg-gray-50 rounded p-4 text-center">
              <p className="text-gray-600">Select a span to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};