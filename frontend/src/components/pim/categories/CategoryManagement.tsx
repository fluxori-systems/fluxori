'use client';

import { useState, useEffect } from 'react';

import CategoryForm from './CategoryForm';
import CategoryTreeView from './CategoryTreeView';
import { api } from '../../../api/apiClient';
import { ProductCategory } from '../../../types/product/product.types';

export default function CategoryManagement() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle category selection from tree view
  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsCreating(false);
    setIsEditing(false);
  };
  
  // Handle create category button click
  const handleCreateCategory = () => {
    setIsCreating(true);
    setIsEditing(false);
  };
  
  // Handle edit category button click
  const handleEditCategory = () => {
    if (selectedCategory) {
      setIsEditing(true);
      setIsCreating(false);
    }
  };
  
  // Handle delete category button click
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    if (selectedCategory.productCount !== undefined && selectedCategory.productCount > 0) {
      alert(`Cannot delete category with ${selectedCategory.productCount} products. Please reassign products first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the category "${selectedCategory.name}"?`)) {
      try {
        await api.pim.deleteCategory(selectedCategory.id);
        // Refresh the page after deletion
        window.location.reload();
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Failed to delete category. It may have subcategories that need to be deleted first.');
      }
    }
  };
  
  // Handle form submission
  const handleFormSubmitted = (category: ProductCategory) => {
    // Refresh the page to update the tree view
    window.location.reload();
  };
  
  // Handle form cancellation
  const handleFormCancelled = () => {
    setIsCreating(false);
    setIsEditing(false);
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Category tree */}
        <div className="md:col-span-1">
          <CategoryTreeView 
            onSelectCategory={handleSelectCategory}
            onCreateCategory={handleCreateCategory}
            selectedCategoryId={selectedCategory?.id}
          />
        </div>
        
        {/* Right column: Category details or form */}
        <div className="md:col-span-2">
          {isCreating ? (
            <CategoryForm 
              onSubmitted={handleFormSubmitted}
              onCancelled={handleFormCancelled}
            />
          ) : isEditing && selectedCategory ? (
            <CategoryForm 
              categoryId={selectedCategory.id}
              initialData={selectedCategory}
              onSubmitted={handleFormSubmitted}
              onCancelled={handleFormCancelled}
            />
          ) : selectedCategory ? (
            <div className="bg-white rounded shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{selectedCategory.name}</h2>
                <div className="space-x-2">
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    onClick={handleEditCategory}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    onClick={handleDeleteCategory}
                    disabled={selectedCategory.productCount !== undefined && selectedCategory.productCount > 0}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-gray-500 text-sm">Slug</h3>
                    <p>{selectedCategory.slug}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-gray-500 text-sm">Status</h3>
                    <p>{selectedCategory.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-gray-500 text-sm">Level</h3>
                    <p>{selectedCategory.level}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-gray-500 text-sm">Product Count</h3>
                    <p>{selectedCategory.productCount || 0}</p>
                  </div>
                </div>
                
                <div>
                  {selectedCategory.imageUrl && (
                    <div className="mb-4">
                      <h3 className="text-gray-500 text-sm">Image</h3>
                      <div className="mt-1 border rounded p-2 bg-gray-100">
                        <img 
                          src={selectedCategory.imageUrl} 
                          alt={selectedCategory.name} 
                          className="max-h-32 max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-gray-500 text-sm">Description</h3>
                    <p className="whitespace-pre-wrap">{selectedCategory.description || 'No description'}</p>
                  </div>
                </div>
              </div>
              
              {selectedCategory.attributes && selectedCategory.attributes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Attributes</h3>
                  <div className="border rounded overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Required</th>
                          <th className="px-4 py-2 text-left">Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCategory.attributes.map((attr, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2">{attr.name}</td>
                            <td className="px-4 py-2">{attr.type}</td>
                            <td className="px-4 py-2">{attr.required ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-2">
                              {attr.options && attr.options.length > 0 
                                ? attr.options.join(', ') 
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded shadow p-6 text-center">
              <p className="text-gray-500">Select a category from the tree or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}