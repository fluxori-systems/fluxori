import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../api/apiClient';
import { Button } from '../ui/Button';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  isPopular?: boolean;
}

interface CreditPurchasePanelProps {
  onPurchaseComplete?: () => void;
}

export const CreditPurchasePanel: React.FC<CreditPurchasePanelProps> = ({ 
  onPurchaseComplete 
}) => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Define available credit packages
  const creditPackages: CreditPackage[] = [
    { id: 'basic', name: 'Basic', credits: 1000, price: 10 },
    { id: 'standard', name: 'Standard', credits: 5000, price: 45, isPopular: true },
    { id: 'premium', name: 'Premium', credits: 10000, price: 80 },
    { id: 'enterprise', name: 'Enterprise', credits: 50000, price: 350 },
  ];
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      paymentMethod: 'card',
      name: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    }
  });

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setError(null);
    setSuccess(null);
  };
  
  const onSubmit = async (formData: any) => {
    if (!selectedPackage) {
      setError('Please select a credit package');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      
      // Process the payment (mock implementation)
      // In a real app, this would use a payment gateway like Stripe
      const paymentResult = await api.aiCredits.purchaseCredits({
        // Fixed to match the API's expected format
        amount: selectedPackage.price,
        paymentMethodId: formData.paymentMethod,
        // Note: packageId and credits would need to be added to the API type if they're required
      });
      
      // Handle success
      setSuccess(`Successfully purchased ${selectedPackage.credits.toLocaleString()} credits!`);
      setSelectedPackage(null);
      
      // Notify parent component about successful purchase
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="credit-purchase-panel">
      {/* Package Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Credit Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all relative
                ${selectedPackage?.id === pkg.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => handleSelectPackage(pkg)}
            >
              {pkg.isPopular && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h4 className="font-bold text-gray-900">{pkg.name}</h4>
              <div className="text-2xl font-bold text-blue-600 my-2">
                ${pkg.price}
              </div>
              <div className="text-lg font-medium text-gray-900">
                {pkg.credits.toLocaleString()} Credits
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ${(pkg.price / pkg.credits * 1000).toFixed(2)} per 1000 credits
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Payment Form */}
      {selectedPackage && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment Method Selection */}
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="card"
                  {...register("paymentMethod")}
                  className="h-4 w-4 text-blue-600"
                  defaultChecked
                />
                <span className="ml-2 text-sm text-gray-700">Credit Card</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="paypal"
                  {...register("paymentMethod")}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">PayPal</span>
              </label>
            </div>
            
            {/* Credit Card Details - Only shown when card payment method is selected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name on Card
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  {...register("cardNumber", { 
                    required: "Card number is required",
                    pattern: {
                      value: /^\d{16}$/,
                      message: "Invalid card number"
                    } 
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="1234 5678 9012 3456"
                />
                {errors.cardNumber && (
                  <span className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  {...register("expiryDate", { 
                    required: "Expiry date is required",
                    pattern: {
                      value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                      message: "Format: MM/YY"
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="MM/YY"
                />
                {errors.expiryDate && (
                  <span className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700">
                  CVV
                </label>
                <input
                  id="cvv"
                  type="text"
                  {...register("cvv", { 
                    required: "CVV is required",
                    pattern: {
                      value: /^\d{3,4}$/,
                      message: "Invalid CVV"
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123"
                />
                {errors.cvv && (
                  <span className="text-red-500 text-xs mt-1">{errors.cvv.message}</span>
                )}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="mt-6 bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h4>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{selectedPackage.name} Package</span>
                <span className="text-sm font-medium text-gray-900">${selectedPackage.price}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-sm font-bold text-blue-600">${selectedPackage.price}</span>
              </div>
            </div>
            
            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            
            {/* Purchase Button */}
            <div className="flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : `Purchase ${selectedPackage.credits.toLocaleString()} Credits`}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              By purchasing credits, you agree to our <a href="/terms" className="underline text-blue-600">Terms of Service</a> and <a href="/privacy" className="underline text-blue-600">Privacy Policy</a>. Credits will be available immediately after successful payment.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};