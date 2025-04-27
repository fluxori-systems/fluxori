"use client";

import { useState, useEffect, useMemo } from "react";

import { useRouter } from "next/navigation";

import { api } from "../../../api/apiClient";
import { useNetworkStatus } from "../../../hooks";
import { Product, ProductStatus } from "../../../types/product/product.types";

// The ProductList component displays a list of products with filtering and pagination
export default function ProductList() {
  const router = useRouter();
  const { isOnline, connectionQuality } = useNetworkStatus();

  // State for products and loading
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Determine page size based on connection quality
  const pageSize = useMemo(() => {
    switch (connectionQuality) {
      case "poor":
      case "critical":
        return 10; // Small page size for poor connections
      case "fair":
        return 20; // Medium page size for fair connections
      case "good":
      case "excellent":
      default:
        return 30; // Larger page size for good connections
    }
  }, [connectionQuality]);

  // Load products with filters
  useEffect(() => {
    const loadProducts = async () => {
      if (!isOnline) {
        setError(
          "Cannot load products while offline. Please check your connection.",
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const offset = (currentPage - 1) * pageSize;

        const response = await api.pim.getProducts({
          limit: pageSize,
          offset,
          categoryId,
          search: searchQuery,
          status: statusFilter,
        });

        setProducts(response.products);
        setTotalProducts(response.total);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    isOnline,
    connectionQuality,
    currentPage,
    pageSize,
    categoryId,
    searchQuery,
    statusFilter,
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(totalProducts / pageSize);

  // Handle product click
  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle category filter change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value || undefined);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter((e.target.value as ProductStatus) || undefined);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render loading state
  if (loading && products.length === 0) {
    return <div className="p-4 text-center">Loading products...</div>;
  }

  // Render error state
  if (error && products.length === 0) {
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

  // Render empty state
  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl mb-4">No products found</h2>
        <p className="mb-4">
          Try adjusting your filters or create a new product.
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => router.push("/products/new")}
        >
          Create New Product
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div className="w-[200px]">
          <select
            value={categoryId || ""}
            onChange={handleCategoryChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">All Categories</option>
            {/* Category options would be loaded dynamically */}
          </select>
        </div>

        <div className="w-[200px]">
          <select
            value={statusFilter || ""}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="">All Statuses</option>
            <option value={ProductStatus.ACTIVE}>Active</option>
            <option value={ProductStatus.INACTIVE}>Inactive</option>
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.ARCHIVED}>Archived</option>
            <option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</option>
            <option value={ProductStatus.DISCONTINUED}>Discontinued</option>
          </select>
        </div>

        <div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => router.push("/products/new")}
          >
            Create New Product
          </button>
        </div>
      </div>

      {/* Loading indicator for subsequent loads */}
      {loading && products.length > 0 && (
        <div className="mb-4 text-center text-gray-500">
          Updating results...
        </div>
      )}

      {/* Products table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left border">Image</th>
              <th className="px-4 py-2 text-left border">SKU</th>
              <th className="px-4 py-2 text-left border">Name</th>
              <th className="px-4 py-2 text-left border">Price</th>
              <th className="px-4 py-2 text-left border">Stock</th>
              <th className="px-4 py-2 text-left border">Status</th>
              <th className="px-4 py-2 text-left border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-2 border">
                  {product.mainImageUrl ? (
                    <img
                      src={product.mainImageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-contain"
                      loading="lazy" // For performance optimization
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 border">{product.sku}</td>
                <td className="px-4 py-2 border">{product.name}</td>
                <td className="px-4 py-2 border">
                  {new Intl.NumberFormat("en-ZA", {
                    style: "currency",
                    currency: product.pricing.currency || "ZAR",
                  }).format(product.pricing.basePrice)}
                </td>
                <td className="px-4 py-2 border">
                  {product.availableQuantity}
                </td>
                <td className="px-4 py-2 border">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.status === ProductStatus.ACTIVE
                        ? "bg-green-100 text-green-800"
                        : product.status === ProductStatus.INACTIVE
                          ? "bg-gray-100 text-gray-800"
                          : product.status === ProductStatus.DRAFT
                            ? "bg-blue-100 text-blue-800"
                            : product.status === ProductStatus.ARCHIVED
                              ? "bg-yellow-100 text-yellow-800"
                              : product.status === ProductStatus.OUT_OF_STOCK
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products/${product.id}/edit`);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            Previous
          </button>

          <span className="mx-4">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
