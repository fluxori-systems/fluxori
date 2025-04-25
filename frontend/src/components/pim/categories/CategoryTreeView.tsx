'use client';

import { useState, useEffect } from 'react';

import { api } from '../../../api/apiClient';
import { useNetworkStatus } from '../../../hooks';
import { ProductCategory } from '../../../types/product/product.types';

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  isActive: boolean;
  level: number;
  productCount?: number;
  originalCategory: ProductCategory;
}

interface CategoryTreeViewProps {
  onSelectCategory?: (category: ProductCategory) => void;
  onCreateCategory?: () => void;
  selectedCategoryId?: string;
}

export default function CategoryTreeView({
  onSelectCategory,
  onCreateCategory,
  selectedCategoryId,
}: CategoryTreeViewProps) {
  const { isOnline, connectionQuality } = useNetworkStatus();
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Load categories and build tree
  useEffect(() => {
    const loadCategories = async () => {
      if (!isOnline) {
        setError('Cannot load categories while offline. Please check your connection.');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Load all categories at once
        const categoriesData = await api.pim.getCategories({ includeSubcategories: true });
        setCategories(categoriesData);
        
        // Build tree structure
        const tree = buildCategoryTree(categoriesData);
        setTreeData(tree);
        
        // Auto-expand first level
        const firstLevelNodes = new Set<string>();
        tree.forEach(node => firstLevelNodes.add(node.id));
        setExpandedNodes(firstLevelNodes);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, [isOnline]);
  
  // Build hierarchical tree from flat category list
  const buildCategoryTree = (categories: ProductCategory[]): TreeNode[] => {
    const categoryMap = new Map<string, TreeNode>();
    
    // First pass: create map of IDs to nodes
    categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        children: [],
        isActive: category.isActive,
        level: category.level,
        productCount: category.productCount,
        originalCategory: category,
      });
    });
    
    const rootNodes: TreeNode[] = [];
    
    // Second pass: build hierarchy
    categories.forEach(category => {
      const node = categoryMap.get(category.id);
      if (!node) return;
      
      if (category.parentId) {
        const parentNode = categoryMap.get(category.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent not found, treat as root node
          rootNodes.push(node);
        }
      } else {
        // No parent, so it's a root node
        rootNodes.push(node);
      }
    });
    
    // Sort nodes by name at each level
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        node.children = sortNodes(node.children);
      });
      return nodes;
    };
    
    return sortNodes(rootNodes);
  };
  
  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  // Handle category selection
  const handleSelectCategory = (category: ProductCategory) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };
  
  // Handle create category button click
  const handleCreateCategory = () => {
    if (onCreateCategory) {
      onCreateCategory();
    }
  };
  
  // Render category tree node recursively
  const renderTreeNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedCategoryId === node.id;
    
    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center py-1.5 pl-${depth * 4} ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'} rounded`}
        >
          {/* Expand/collapse button */}
          <button 
            className={`mr-1 w-5 h-5 flex items-center justify-center ${hasChildren ? '' : 'invisible'}`}
            onClick={() => toggleNode(node.id)}
          >
            {hasChildren && (isExpanded ? '−' : '+')}
          </button>
          
          {/* Category name and status */}
          <div 
            className={`flex-1 cursor-pointer flex items-center ${!node.isActive ? 'text-gray-400' : ''}`}
            onClick={() => handleSelectCategory(node.originalCategory)}
          >
            {node.name}
            {node.productCount !== undefined && (
              <span className="ml-2 text-xs text-gray-500">({node.productCount})</span>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {isExpanded && node.children.length > 0 && (
          <div className={`pl-5 ${connectionQuality === 'critical' ? 'max-h-32 overflow-y-auto' : ''}`}>
            {node.children.map(childNode => renderTreeNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Loading state
  if (loading && categories.length === 0) {
    return <div className="p-4 text-center">Loading categories...</div>;
  }
  
  // Error state
  if (error && categories.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <button 
          className="ml-2 underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Empty state
  if (treeData.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl mb-4">No categories found</h2>
        <p className="mb-4">Start by creating a root category.</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={handleCreateCategory}
        >
          Create Category
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Categories</h2>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={handleCreateCategory}
        >
          Add Category
        </button>
      </div>
      
      {/* Search filter - could be added in future enhancement */}
      
      {/* Tree view */}
      <div className={`p-4 overflow-auto ${connectionQuality === 'critical' ? 'max-h-64' : 'max-h-[70vh]'}`}>
        {treeData.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}