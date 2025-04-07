import React, { useEffect, useRef, useState } from 'react';
import { TextProps } from '@mantine/core'
import { Text } from '@/components/ui';
import { useReducedMotion } from './useReducedMotion';
import { AI_ANIMATION } from './constants';

export interface StreamingTextProps extends TextProps {
  /** Text content to stream in */
  content: string;
  /** Determines streaming speed - characters per second */
  speed?: 'slow' | 'medium' | 'fast' | number;
  /** Whether text is actively streaming */
  isStreaming?: boolean;
  /** Callback when streaming completes */
  onStreamComplete?: () => void;
}

/**
 * Component that displays text with a typewriter-like streaming effect
 * commonly used for AI-generated content. Respects reduced motion preferences.
 */
export function StreamingText({
  content,
  speed = 'medium',
  isStreaming = true,
  onStreamComplete,
  ...props
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { prefersReducedMotion } = useReducedMotion();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine streaming speed (chars per second)
  const getCharactersPerSecond = (): number => {
    if (typeof speed === 'number') return speed;
    
    switch (speed) {
      case 'fast': return AI_ANIMATION.STREAMING_TEXT.FAST;
      case 'slow': return AI_ANIMATION.STREAMING_TEXT.SLOW;
      case 'medium':
      default: return AI_ANIMATION.STREAMING_TEXT.MEDIUM;
    }
  };

  useEffect(() => {
    // Reset state when content changes
    setDisplayedContent('');
    setIsComplete(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Show full content immediately if reduced motion is preferred
    if (prefersReducedMotion) {
      setDisplayedContent(content);
      setIsComplete(true);
      if (onStreamComplete) onStreamComplete();
      return;
    }
    
    // Only animate if streaming is enabled
    if (!isStreaming) {
      setDisplayedContent(content);
      setIsComplete(true);
      if (onStreamComplete) onStreamComplete();
      return;
    }
    
    // Calculate delay between characters
    const charsPerSecond = getCharactersPerSecond();
    const msPerChar = 1000 / charsPerSecond;
    
    let currentIndex = 0;
    
    // Streaming animation function
    const streamNextChar = () => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(streamNextChar, msPerChar);
      } else {
        setIsComplete(true);
        if (onStreamComplete) onStreamComplete();
      }
    };
    
    // Start streaming
    timeoutRef.current = setTimeout(streamNextChar, msPerChar);
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isStreaming, prefersReducedMotion, onStreamComplete]);

  return (
    <Text {...props}>
      {displayedContent}
      {/* Show blinking cursor at the end while streaming */}
      {isStreaming && !isComplete && (
        <span 
          style={{ 
            display: 'inline-block',
            width: '0.5em',
            height: '1em',
            backgroundColor: 'currentColor',
            opacity: 0.7,
            animation: 'blink 0.8s step-end infinite',
            verticalAlign: 'middle',
            marginLeft: '1px',
          }}
          aria-hidden="true"
        />
      )}
    </Text>
  );
}