'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStatus, useImageUpload } from '../../../hooks';
import { api } from '../../../api/apiClient';
import { 
  Product, 
  ProductStatus, 
  ProductType, 
  CreateProductDto, 
  UpdateProductDto, 
  ProductCategory
} from '../../../types/product/product.types';

interface ProductFormProps {
  productId?: string; // If provided, we're editing an existing product
  initialData?: Product; // Optional initial data for the form
}

export default function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const { isOnline, connectionQuality } = useNetworkStatus();
  const { uploadImage, isUploading, error: imageUploadError } = useImageUpload();
  
  // Form state
  const [formData, setFormData] = useState<CreateProductDto>({
    sku: '',
    name: '',
    description: '',
    type: ProductType.PHYSICAL,
    status: ProductStatus.DRAFT,
    categoryIds: [],
    pricing: {
      basePrice: 0,
      currency: 'ZAR',
    },
    hasVariants: false,
    stockQuantity: 0,
    attributes: {},
    tags: [],
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  
  // Load product data if editing
  useEffect(() => {
    const initializeForm = async () => {
      // If initialData is provided, use it
      if (initialData) {
        setFormData({
          sku: initialData.sku,
          name: initialData.name,
          description: initialData.description || '',
          type: initialData.type,
          status: initialData.status,
          categoryIds: initialData.categoryIds || [],
          pricing: initialData.pricing,
          brandId: initialData.brandId,
          hasVariants: initialData.hasVariants,
          stockQuantity: initialData.stockQuantity,
          attributes: initialData.attributes || {},
          tags: initialData.tags || [],
        });
        
        if (initialData.mainImageUrl) {
          setImageSrc(initialData.mainImageUrl);
        }
        
        setLoading(false);
        return;
      }
      
      // If productId is provided but no initialData, load the product
      if (productId) {
        if (!isOnline) {
          setError('Cannot load product while offline. Please check your connection.');
          setLoading(false);
          return;
        }
        
        try {
          const product = await api.pim.getProduct(productId);
          
          setFormData({
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            type: product.type,
            status: product.status,
            categoryIds: product.categoryIds || [],
            pricing: product.pricing,
            brandId: product.brandId,
            hasVariants: product.hasVariants,
            stockQuantity: product.stockQuantity,
            attributes: product.attributes || {},
            tags: product.tags || [],
          });
          
          if (product.mainImageUrl) {
            setImageSrc(product.mainImageUrl);
          }
        } catch (err) {
          console.error('Failed to load product:', err);
          setError('Failed to load product. Please try again later.');
        }
      }
      
      setLoading(false);
    };
    
    const loadCategories = async () => {
      if (!isOnline) {
        return;
      }
      
      try {
        const categoryData = await api.pim.getCategories();
        setCategories(categoryData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    
    Promise.all([initializeForm(), loadCategories()]);
  }, [productId, initialData, isOnline]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData({
        ...formData,
        pricing: {
          ...(formData.pricing || {}),
          [pricingField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle numeric field changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    
    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData({
        ...formData,
        pricing: {
          ...(formData.pricing || {}),
          [pricingField]: numericValue,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    try {
      // Use the uploadImage hook to handle the upload with network-aware optimization
      const result = await uploadImage(file, {
        path: 'products',
        filename: `${formData.sku || 'product'}-${Date.now()}`,
        compress: true,
        networkAware: true,
        useWebP: true,
      });
      
      if (result?.url) {
        setImageSrc(result.url);
        // If we're editing a product, update the mainImageUrl field
        if (productId) {
          await api.pim.updateProduct(productId, {
            ...formData,
            mainImageUrl: result.url,
          });
        } else {
          // Otherwise just update the form data with the mainImageUrl
          setFormData({
            ...formData as CreateProductDto,
            mainImageUrl: result.url,
          } as CreateProductDto);
        }
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    }
  };
  
  // Handle multi-select for categories
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData({
      ...formData,
      categoryIds: selectedOptions,
    });
  };
  
  // Handle tags input
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData({
      ...formData,
      tags,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('Cannot save product while offline. Please check your connection.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // Update or create product
      if (productId) {
        await api.pim.updateProduct(productId, formData as UpdateProductDto);
      } else {
        const newProduct = await api.pim.createProduct(formData as CreateProductDto);
        // Redirect to the edit page for the new product
        router.push(`/products/${newProduct.id}/edit`);
        return; // Return early to prevent the redirect below
      }
      
      // Redirect to the products list
      router.push('/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      setError('Failed to save product. Please check your inputs and try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    router.push('/products');
  };
  
  // Loading state
  if (loading) {
    return <div className="p-4 text-center">Loading product data...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {productId ? 'Edit Product' : 'Create New Product'}
      </h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {!isOnline && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          You are currently offline. Changes cannot be saved.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="sku">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-gray-700 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="type">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              >
                <option value={ProductType.PHYSICAL}>Physical</option>
                <option value={ProductType.DIGITAL}>Digital</option>
                <option value={ProductType.SERVICE}>Service</option>
                <option value={ProductType.BUNDLE}>Bundle</option>
                <option value={ProductType.SUBSCRIPTION}>Subscription</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="status">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              >
                <option value={ProductStatus.ACTIVE}>Active</option>
                <option value={ProductStatus.INACTIVE}>Inactive</option>
                <option value={ProductStatus.DRAFT}>Draft</option>
                <option value={ProductStatus.ARCHIVED}>Archived</option>
                <option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</option>
                <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="hasVariants">
                Has Variants
              </label>
              <div className="flex items-center h-10">
                <input
                  id="hasVariants"
                  name="hasVariants"
                  type="checkbox"
                  checked={formData.hasVariants}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5"
                />
                <span className="ml-2">This product has variants</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="pricing.basePrice">
                Base Price <span className="text-red-500">*</span>
              </label>
              <input
                id="pricing.basePrice"
                name="pricing.basePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing?.basePrice || 0}
                onChange={handleNumberChange}
                required
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="pricing.salePrice">
                Sale Price
              </label>
              <input
                id="pricing.salePrice"
                name="pricing.salePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing?.salePrice || ''}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="pricing.currency">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                id="pricing.currency"
                name="pricing.currency"
                value={formData.pricing?.currency || 'ZAR'}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              >
                <option value="ZAR">South African Rand (ZAR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="NAD">Namibian Dollar (NAD)</option>
                <option value="BWP">Botswana Pula (BWP)</option>
                <option value="ZMW">Zambian Kwacha (ZMW)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="NGN">Nigerian Naira (NGN)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="pricing.taxRate">
                Tax Rate (%)
              </label>
              <input
                id="pricing.taxRate"
                name="pricing.taxRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricing?.taxRate || ''}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="15"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="pricing.taxCode">
                Tax Code
              </label>
              <input
                id="pricing.taxCode"
                name="pricing.taxCode"
                type="text"
                value={formData.pricing?.taxCode || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                placeholder="e.g., VAT"
              />
            </div>
          </div>
        </div>
        
        {/* Categories */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="categoryIds">
              Select Categories
            </label>
            <select
              id="categoryIds"
              name="categoryIds"
              multiple
              value={formData.categoryIds || []}
              onChange={handleCategoryChange}
              className="w-full px-4 py-2 border rounded h-32"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.path && category.path.length > 0 
                    ? category.path.join(' > ') + ' > ' + category.name 
                    : category.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">Hold Ctrl (or Cmd) to select multiple categories</p>
          </div>
        </div>
        
        {/* Inventory */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="stockQuantity">
                Stock Quantity
              </label>
              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                value={formData.stockQuantity || 0}
                onChange={handleNumberChange}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Images</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Main Image</label>
              <div className="border rounded p-4 flex items-center justify-center bg-gray-100 h-40">
                {imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt="Product" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400">No image uploaded</div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="mt-2 text-blue-500">Uploading image...</div>
              )}
              {imageUploadError && (
                <div className="mt-2 text-red-500">{imageUploadError.message}</div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {connectionQuality === 'poor' || connectionQuality === 'critical'
                  ? 'Low connection quality detected. Images will be highly compressed.'
                  : connectionQuality === 'fair'
                  ? 'Fair connection quality. Images will be moderately compressed.'
                  : 'Good connection quality. Images will be optimized for quality.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tags</h2>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="tags">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={handleTagsChange}
              className="w-full px-4 py-2 border rounded"
              placeholder="e.g., featured, new, sale"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border rounded"
            disabled={saving}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            disabled={saving || !isOnline}
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}