'use client';

import React, { useState, useRef } from 'react';
import { Card, Text } from '../../lib/ui';
import { useConnectionQuality } from '../../lib/motion/hooks/useConnectionQuality';
import { formatCurrency } from '../../utils/currency-formatter';
import { useCombinedRefs } from '../../lib/ui/utils/use-combined-refs';
import { useComponentAnimation } from '../../lib/ui/hooks/useComponentAnimation';
import { useTokenTracking } from '../../lib/design-system/utils/token-analysis';

export interface SAProductCardProps {
  /** Product title */
  title: string;
  
  /** Product price in ZAR */
  price: number;
  
  /** Discount percentage (if applicable) */
  discountPercentage?: number;
  
  /** Original price before discount */
  originalPrice?: number;
  
  /** Product image URL */
  imageUrl?: string;
  
  /** Product rating (0-5) */
  rating?: number;
  
  /** Number of reviews */
  reviewCount?: number;
  
  /** Stock status */
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  
  /** Available shipping methods */
  shippingMethods?: Array<'standard' | 'express' | 'collection'>;
  
  /** Estimated delivery time in days */
  estimatedDeliveryDays?: number;
  
  /** Whether the product is eligible for free shipping */
  freeShipping?: boolean;
  
  /** Whether to show data-saver optimized version */
  forceDataSaver?: boolean;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Additional className */
  className?: string;
}

/**
 * Specialized product card optimized for South African e-commerce
 * Features:
 * - Network-aware optimizations for variable connection quality
 * - Data-saver mode support
 * - Simplified view for slow connections
 * - Special emphasis on shipping methods and delivery time (important for SA market)
 * - ZAR currency formatting
 */
export function SAProductCard({
  title,
  price,
  discountPercentage,
  originalPrice,
  imageUrl,
  rating,
  reviewCount,
  stockStatus = 'in_stock',
  shippingMethods = ['standard'],
  estimatedDeliveryDays,
  freeShipping = false,
  forceDataSaver = false,
  onClick,
  className = '',
}: SAProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const tokenTracking = useTokenTracking('SAProductCard');
  const { quality, isDataSaver, isMetered } = useConnectionQuality();
  
  // Determine if we should show the simplified view
  const shouldSimplify = forceDataSaver || isDataSaver || quality === 'poor' || quality === 'low';
  
  // Tracking token usage for analytics
  tokenTracking.trackToken(`stock-status-${stockStatus}`);
  tokenTracking.trackToken(`connection-quality-${quality}`);
  tokenTracking.trackToken(`shipping-methods-count-${shippingMethods.length}`);
  
  // Apply hover animation
  useComponentAnimation({
    ref: cardRef,
    enabled: !shouldSimplify,
    mode: 'hover',
    isActive: isHovered,
    networkAware: true,
    properties: {
      y: isHovered ? -5 : 0,
      boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
    }
  });
  
  // Handle mouse events
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Format currency specifically for South African Rand
  const formattedPrice = formatCurrency(price, 'ZAR');
  const formattedOriginalPrice = originalPrice ? formatCurrency(originalPrice, 'ZAR') : '';
  
  // Get the appropriate stock status text
  const getStockStatusText = () => {
    switch (stockStatus) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'in_stock':
      default:
        return 'In Stock';
    }
  };
  
  // Get shipping info text based on methods
  const getShippingText = () => {
    if (shouldSimplify) {
      // Simplified shipping info for slow connections
      return freeShipping ? 'Free Shipping' : 'Shipping Available';
    }
    
    const methodText = shippingMethods.map(method => 
      method === 'standard' ? 'Standard' : 
      method === 'express' ? 'Express' : 
      'Collection'
    ).join(', ');
    
    return `${freeShipping ? 'Free ' : ''}${methodText} Shipping${estimatedDeliveryDays ? ` (${estimatedDeliveryDays} days)` : ''}`;
  };
  
  // Different Card variants based on connection quality
  if (shouldSimplify) {
    // Simplified card for poor connections - no animations, minimal styling
    return (
      <Card
        withBorder
        shadow="xs"
        radius="sm"
        className={`sa-product-card sa-product-card-simplified ${className}`}
        onClick={onClick}
        data-network-quality={quality}
        data-simplified={true}
      >
        <Text preset="heading4" fw={600} style={{ marginBottom: 8 }}>{title}</Text>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text preset="heading5" intent="primary">{formattedPrice}</Text>
          {discountPercentage && (
            <Text intent="error" span fw={500}>{discountPercentage}% OFF</Text>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text preset="caption" role={stockStatus === 'out_of_stock' ? 'error' : stockStatus === 'low_stock' ? 'warning' : 'success'}>
            {getStockStatusText()}
          </Text>
          {freeShipping && <Text preset="caption" role="info">Free Shipping</Text>}
        </div>
      </Card>
    );
  }
  
  // Full featured card for better connections
  return (
    <Card
      ref={cardRef}
      withBorder
      shadow="sm"
      radius="md"
      className={`sa-product-card ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-network-quality={quality}
      animated={true}
      animationType="hover"
      networkAware={true}
    >
      {imageUrl && (
        <div className="sa-product-card-image-container" style={{ marginBottom: 12, textAlign: 'center' }}>
          <img 
            src={imageUrl} 
            alt={title} 
            className="sa-product-card-image"
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: 200,
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        </div>
      )}
      
      <Text preset="heading4" fw={600} style={{ marginBottom: 8 }}>{title}</Text>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Text preset="heading3" intent="primary">{formattedPrice}</Text>
          {originalPrice && (
            <Text preset="caption" td="line-through" style={{ marginLeft: 8 }}>
              {formattedOriginalPrice}
            </Text>
          )}
        </div>
        
        {discountPercentage && (
          <div 
            style={{ 
              backgroundColor: 'var(--color-error-100)', 
              color: 'var(--color-error-700)',
              padding: '4px 8px',
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            {discountPercentage}% OFF
          </div>
        )}
      </div>
      
      {(rating !== undefined && reviewCount !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', marginRight: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: i < Math.floor(rating) ? 'var(--color-warning-500)' : 'var(--color-gray-300)' }}>
                ★
              </span>
            ))}
          </div>
          <Text preset="caption">({reviewCount})</Text>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <Text 
          preset="caption" 
          role={stockStatus === 'out_of_stock' ? 'error' : stockStatus === 'low_stock' ? 'warning' : 'success'}
        >
          {getStockStatusText()}
        </Text>
        <Text preset="caption" role="info">{getShippingText()}</Text>
      </div>
    </Card>
  );
}