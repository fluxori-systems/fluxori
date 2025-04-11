'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useConnectionQuality } from '../hooks/useConnectionQuality';
import { useSouthAfricanPerformance } from '../hooks/useSouthAfricanPerformance';

// Constants for optimization
const EUROPE_SA_LATENCY_MS = 180; // Average latency from Europe to South Africa
const PREDICTION_CONFIDENCE_THRESHOLD = 0.85; // Threshold for prediction confidence

interface AIResponseOptimizerProps {
  /** Component children */
  children: React.ReactNode;
  
  /** Function that makes the actual AI request */
  requestFunction: (prompt: string) => Promise<string>;
  
  /** Current prompt or input (for request prediction) */
  prompt: string;
  
  /** Optional className */
  className?: string;
  
  /** Whether to preemptively generate responses */
  enablePredictiveGeneration?: boolean;
  
  /** Maximum number of cached predictions */
  maxCachedPredictions?: number;
  
  /** Whether to show spinner while waiting for initial response */
  showLoadingIndicator?: boolean;
  
  /** Time to wait before showing loading indicator (ms) */
  loadingIndicatorDelay?: number;
  
  /** Whether to progressively render streaming text responses */
  enableProgressiveRender?: boolean;
  
  /** Whether to show simulated response when offline */
  enableOfflineMode?: boolean;
  
  /** Whether to show response status information (dev only) */
  showDebugInfo?: boolean;
}

/**
 * Component that optimizes AI response loading specifically for South African
 * network conditions when connecting to European GenAI services.
 * 
 * Optimizations:
 * - Progressive text streaming to start showing responses immediately
 * - Predictive pre-fetching for common queries
 * - Offline mode that shows simulated responses when connection is poor
 * - Smart caching based on South African network conditions
 * - Adaptive loading indicators with optimistic delay for perceived performance
 */
export const AIResponseOptimizer: React.FC<AIResponseOptimizerProps> = ({
  children,
  requestFunction,
  prompt,
  className = '',
  enablePredictiveGeneration = true,
  maxCachedPredictions = 5,
  showLoadingIndicator = true,
  loadingIndicatorDelay = 300,
  enableProgressiveRender = true,
  enableOfflineMode = true,
  showDebugInfo = false
}) => {
  // Get connection quality for adaptive optimizations
  const { quality, isDataSaver, downlinkSpeed, rtt } = useConnectionQuality();
  const { networkProfile } = useSouthAfricanPerformance();
  
  // States for response management
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldShowIndicator, setShouldShowIndicator] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [isStreamingResponse, setIsStreamingResponse] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>('');
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [predictionHit, setPredictionHit] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<{
    latency: number;
    cacheStatus: string;
    connectionQuality: string;
    predictiveStatus: string;
  }>({
    latency: 0,
    cacheStatus: 'none',
    connectionQuality: quality,
    predictiveStatus: 'disabled'
  });
  
  // Cache of previous responses
  const responseCache = useRef<Map<string, string>>(new Map());
  
  // Storage for predictive generations
  const predictiveCache = useRef<Map<string, { response: string, confidence: number }>>(
    new Map()
  );
  
  // Handle AI request with optimizations
  const handleRequest = async (promptText: string) => {
    // Don't process empty prompts
    if (!promptText.trim()) return;
    
    // Check if offline - network detection
    if (navigator.onLine === false || quality === 'poor') {
      setIsOffline(true);
      
      if (enableOfflineMode) {
        // Return cached response if available
        const cachedResponse = responseCache.current.get(promptText);
        if (cachedResponse) {
          setResponse(cachedResponse);
          simulateProgressiveResponse(cachedResponse);
          return;
        }
        
        // Return simulated response
        const simulatedResponse = "I'm currently unable to process your request due to network connectivity issues. This is a simulated response based on previous interactions. Please check your connection and try again.";
        setResponse(simulatedResponse);
        simulateProgressiveResponse(simulatedResponse);
        return;
      }
    } else {
      setIsOffline(false);
    }
    
    // Check prediction cache for optimistic responses
    if (enablePredictiveGeneration) {
      for (const [predictedPrompt, prediction] of predictiveCache.current.entries()) {
        // Calculate similarity between current prompt and predicted prompt
        const similarity = calculateTextSimilarity(promptText, predictedPrompt);
        
        // If similarity is high and confidence is above threshold, use predicted response
        if (similarity > 0.8 && prediction.confidence >= PREDICTION_CONFIDENCE_THRESHOLD) {
          setPredictionHit(true);
          setDebugInfo(prev => ({
            ...prev,
            predictiveStatus: `hit (similarity: ${similarity.toFixed(2)}, confidence: ${prediction.confidence.toFixed(2)})`
          }));
          
          // Immediately show predicted response
          setResponse(prediction.response);
          simulateProgressiveResponse(prediction.response);
          
          // Still make actual request in background to validate prediction
          requestFunction(promptText).then(actualResponse => {
            // Update cache with actual response
            responseCache.current.set(promptText, actualResponse);
            
            // If prediction was significantly different, fade to actual response
            if (calculateTextSimilarity(prediction.response, actualResponse) < 0.9) {
              // Smoothly transition to actual response
              setResponse(actualResponse);
              simulateProgressiveResponse(actualResponse, true);
            }
          }).catch(error => {
            console.error('Background validation request failed:', error);
          });
          
          return;
        }
      }
    }
    
    // Check regular cache
    const cachedResponse = responseCache.current.get(promptText);
    if (cachedResponse) {
      setDebugInfo(prev => ({
        ...prev,
        cacheStatus: 'hit'
      }));
      
      setResponse(cachedResponse);
      simulateProgressiveResponse(cachedResponse);
      return;
    }
    
    // No cache hit, make actual request
    setDebugInfo(prev => ({
      ...prev,
      cacheStatus: 'miss'
    }));
    
    // Start loading state
    setIsLoading(true);
    const startTime = performance.now();
    
    // Set timeout for showing indicator (perceived performance optimization)
    const indicatorTimeout = setTimeout(() => {
      setShouldShowIndicator(true);
    }, loadingIndicatorDelay);
    
    try {
      // Make the actual request
      const result = await requestFunction(promptText);
      
      // Calculate latency
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      setDebugInfo(prev => ({
        ...prev,
        latency
      }));
      
      // Clear loading indicator timeout
      clearTimeout(indicatorTimeout);
      
      // Update cache (both response and predictive)
      responseCache.current.set(promptText, result);
      
      // Limit cache size
      if (responseCache.current.size > maxCachedPredictions * 2) {
        const oldestKey = responseCache.current.keys().next().value;
        if (oldestKey !== undefined) {
          responseCache.current.delete(oldestKey);
        }
      }
      
      // Set response
      setResponse(result);
      
      // Handle progressive rendering
      if (enableProgressiveRender) {
        simulateProgressiveResponse(result);
      }
      
      // Generate predictive responses for future queries if enabled
      if (enablePredictiveGeneration) {
        generatePredictiveResponses(promptText, result);
      }
    } catch (error) {
      console.error('AI request failed:', error);
      clearTimeout(indicatorTimeout);
      
      // Use offline mode response if enabled
      if (enableOfflineMode) {
        const fallbackResponse = "I'm having trouble processing your request. This could be due to network connectivity issues between South Africa and our AI servers in Europe. Please try again shortly.";
        setResponse(fallbackResponse);
        simulateProgressiveResponse(fallbackResponse);
      }
    } finally {
      setIsLoading(false);
      setShouldShowIndicator(false);
    }
  };
  
  // Handle request when prompt changes
  useEffect(() => {
    if (prompt) {
      handleRequest(prompt);
    }
  }, [prompt]);
  
  // Progressive text rendering simulation
  const simulateProgressiveResponse = (fullText: string, isCorrectionFromPrediction = false) => {
    if (!enableProgressiveRender) {
      setStreamedText(fullText);
      return;
    }
    
    setIsStreamingResponse(true);
    setStreamProgress(0);
    
    // Calculate stream speed based on connection quality
    let streamDuration = 1000; // default 1 second for full text
    if (quality === 'low') streamDuration = 1500;
    if (quality === 'poor') streamDuration = 2000;
    
    // For prediction corrections, make it shorter
    if (isCorrectionFromPrediction) streamDuration = 500;
    
    // Create array of chunks to display
    const chunks = Math.max(15, Math.floor(fullText.length / 5));
    let currentPos = 0;
    
    // Clear any existing interval
    const streamingInterval = setInterval(() => {
      currentPos += 1;
      
      if (currentPos <= chunks) {
        // Calculate what portion of text to show
        const progress = currentPos / chunks;
        const textToShow = fullText.substring(0, Math.floor(fullText.length * progress));
        
        setStreamedText(textToShow);
        setStreamProgress(progress * 100);
      } else {
        // Finished streaming
        setStreamedText(fullText);
        setStreamProgress(100);
        setIsStreamingResponse(false);
        clearInterval(streamingInterval);
      }
    }, streamDuration / chunks);
    
    // Cleanup interval on unmount
    return () => clearInterval(streamingInterval);
  };
  
  // Generate predictive responses for future queries
  const generatePredictiveResponses = (currentPrompt: string, currentResponse: string) => {
    // Only store a limited number of predictions
    if (predictiveCache.current.size >= maxCachedPredictions) {
      // Remove entry with lowest confidence
      let lowestConfidenceKey = '';
      let lowestConfidence = 1.0;
      
      for (const [key, prediction] of predictiveCache.current.entries()) {
        if (prediction.confidence < lowestConfidence) {
          lowestConfidence = prediction.confidence;
          lowestConfidenceKey = key;
        }
      }
      
      if (lowestConfidenceKey) {
        predictiveCache.current.delete(lowestConfidenceKey);
      }
    }
    
    // Simple prediction: Add potential follow-up questions and variants
    const followUpPrompts = generateFollowUpPrompts(currentPrompt, currentResponse);
    
    // Add predictions to cache with confidence values
    followUpPrompts.forEach(({ prompt: predictedPrompt, response: predictedResponse, confidence }) => {
      predictiveCache.current.set(predictedPrompt, {
        response: predictedResponse,
        confidence
      });
    });
    
    setDebugInfo(prev => ({
      ...prev,
      predictiveStatus: `generated ${followUpPrompts.length} predictions`
    }));
  };
  
  // Text similarity calculation (simple implementation)
  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const tokens1 = text1.toLowerCase().split(/\W+/).filter(Boolean);
    const tokens2 = text2.toLowerCase().split(/\W+/).filter(Boolean);
    
    // Count matching tokens
    let matches = 0;
    for (const token of tokens1) {
      if (tokens2.includes(token)) {
        matches++;
      }
    }
    
    return matches / Math.max(tokens1.length, tokens2.length);
  };
  
  // Generate follow-up prompts and predicted responses
  const generateFollowUpPrompts = (
    prompt: string, 
    response: string
  ): Array<{ prompt: string; response: string; confidence: number }> => {
    // This is a simplified implementation - in a real system this would be
    // more sophisticated with actual ML-based prediction
    
    const results: Array<{ prompt: string; response: string; confidence: number }> = [];
    
    // 1. Generate variation with "more details" follow-up
    const moreDetailsPrompt = `${prompt} Please provide more details.`;
    const moreDetailsResponse = `${response} Here are some additional details: ...`;
    results.push({
      prompt: moreDetailsPrompt,
      response: moreDetailsResponse,
      confidence: 0.9,
    });
    
    // 2. Generate variation with "why" follow-up
    const whyPrompt = `Why ${prompt.toLowerCase()}?`;
    const whyResponse = `The reason is related to ${response.substring(0, 100)}... Let me explain further: ...`;
    results.push({
      prompt: whyPrompt,
      response: whyResponse,
      confidence: 0.85,
    });
    
    // 3. Generate variation with clarification
    const clarificationPrompt = `What do you mean by "${prompt}"?`;
    const clarificationResponse = `When I mentioned "${prompt}", I was referring to ${response.substring(0, 80)}...`;
    results.push({
      prompt: clarificationPrompt,
      response: clarificationResponse, 
      confidence: 0.8,
    });
    
    return results;
  };
  
  return (
    <div className={`ai-response-optimizer ${className}`}>
      {/* Main content */}
      <div className="ai-response-content">
        {children}
        
        {/* Text response with optimizations */}
        {response && (
          <div className="ai-response-text">
            {isStreamingResponse ? streamedText : response}
            {isStreamingResponse && (
              <span className="ai-response-cursor">▋</span>
            )}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && shouldShowIndicator && showLoadingIndicator && (
          <div className="ai-loading-indicator">
            <div className="ai-loading-spinner"></div>
            <p className="ai-loading-text">
              {quality === 'poor' ? 
                'Loading response (slow connection detected)...' : 
                'Loading response...'}
            </p>
          </div>
        )}
        
        {/* Offline mode indicator */}
        {isOffline && (
          <div className="ai-offline-indicator">
            <p className="ai-offline-text">
              You appear to be offline or on a very slow connection. 
              {enableOfflineMode ? ' Showing cached response.' : ' Please reconnect and try again.'}
            </p>
          </div>
        )}
        
        {/* Debug information (dev only) */}
        {showDebugInfo && (
          <div className="ai-debug-info">
            <details>
              <summary>AI Optimization Debug Info</summary>
              <table>
                <tbody>
                  <tr>
                    <td>Connection Quality:</td>
                    <td>{quality} {isDataSaver ? '(Data Saver)' : ''}</td>
                  </tr>
                  <tr>
                    <td>Network:</td>
                    <td>{networkProfile?.provider || 'Unknown'} {networkProfile?.networkType || ''}</td>
                  </tr>
                  <tr>
                    <td>Downlink:</td>
                    <td>{downlinkSpeed ? `${downlinkSpeed.toFixed(1)} Mbps` : 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td>RTT:</td>
                    <td>{rtt ? `${rtt}ms` : 'Unknown'}</td>
                  </tr>
                  <tr>
                    <td>Response Time:</td>
                    <td>{debugInfo.latency ? `${debugInfo.latency.toFixed(0)}ms` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td>Cache Status:</td>
                    <td>{debugInfo.cacheStatus}</td>
                  </tr>
                  <tr>
                    <td>Prediction Status:</td>
                    <td>{debugInfo.predictiveStatus}</td>
                  </tr>
                  <tr>
                    <td>Progressive Render:</td>
                    <td>{enableProgressiveRender ? 'Enabled' : 'Disabled'}</td>
                  </tr>
                  <tr>
                    <td>Cached Prompt Count:</td>
                    <td>{responseCache.current.size}</td>
                  </tr>
                  <tr>
                    <td>Predictive Cache Size:</td>
                    <td>{predictiveCache.current.size}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        )}
      </div>
      
      {/* Styling */}
      <style jsx>{`
        .ai-response-optimizer {
          position: relative;
          width: 100%;
        }
        
        .ai-response-content {
          position: relative;
        }
        
        .ai-response-text {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .ai-response-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background-color: currentColor;
          animation: blink 0.8s infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
        
        .ai-loading-indicator {
          display: flex;
          align-items: center;
          margin-top: 1rem;
        }
        
        .ai-loading-spinner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #eee;
          border-top-color: #666;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }
        
        .ai-loading-text {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
        }
        
        .ai-offline-indicator {
          margin-top: 1rem;
          padding: 0.5rem;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
        }
        
        .ai-offline-text {
          font-size: 0.9rem;
          color: #856404;
          margin: 0;
        }
        
        .ai-debug-info {
          margin-top: 1rem;
          padding: 0.5rem;
          border: 1px solid #eee;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        .ai-debug-info details summary {
          cursor: pointer;
          font-weight: bold;
        }
        
        .ai-debug-info table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 0.5rem;
        }
        
        .ai-debug-info td {
          padding: 0.25rem;
          border-bottom: 1px solid #eee;
        }
        
        .ai-debug-info td:first-child {
          font-weight: bold;
          width: 40%;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIResponseOptimizer;