"use client";

import { useState, useEffect } from "react";

import { api } from "../../../api/apiClient";
import { useNetworkStatus, useImageUpload } from "../../../hooks";
import { ProductCategory } from "../../../types/product/product.types";

interface CategoryFormProps {
  categoryId?: string; // If provided, we're editing an existing category
  initialData?: ProductCategory; // Optional initial data for the form
  onSubmitted?: (category: ProductCategory) => void;
  onCancelled?: () => void;
}

export default function CategoryForm({
  categoryId,
  initialData,
  onSubmitted,
  onCancelled,
}: CategoryFormProps) {
  const { isOnline, connectionQuality } = useNetworkStatus();
  const {
    uploadImage,
    isUploading,
    error: imageUploadError,
  } = useImageUpload();

  // Form state
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    isActive: true,
    attributes: [],
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Load category data if editing
  useEffect(() => {
    const initializeForm = async () => {
      // If initialData is provided, use it
      if (initialData) {
        setFormData({
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || "",
          parentId: initialData.parentId || "",
          isActive: initialData.isActive,
          attributes: initialData.attributes || [],
        });

        if (initialData.imageUrl) {
          setImageSrc(initialData.imageUrl);
        }

        setLoading(false);
        return;
      }

      // If categoryId is provided but no initialData, load the category
      if (categoryId) {
        if (!isOnline) {
          setError(
            "Cannot load category while offline. Please check your connection.",
          );
          setLoading(false);
          return;
        }

        try {
          const category = await api.pim.getCategory(categoryId);

          setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            parentId: category.parentId || "",
            isActive: category.isActive,
            attributes: category.attributes || [],
          });

          if (category.imageUrl) {
            setImageSrc(category.imageUrl);
          }
        } catch (err) {
          console.error("Failed to load category:", err);
          setError("Failed to load category. Please try again later.");
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
        // Filter out the current category if we're editing (to prevent selecting self as parent)
        const filteredCategories = categoryId
          ? categoryData.filter((category) => category.id !== categoryId)
          : categoryData;
        setCategories(filteredCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    Promise.all([initializeForm(), loadCategories()]);
  }, [categoryId, initialData, isOnline]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto-generate slug from name if slug is empty
    if (name === "name" && (!formData.slug || formData.slug === "")) {
      setFormData((prev) => ({
        ...prev,
        slug: value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }));
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
        path: "categories",
        filename: `category-${formData.slug || "new"}-${Date.now()}`,
        compress: true,
        networkAware: true,
        useWebP: true,
      });

      if (result?.url) {
        setImageSrc(result.url);
        setFormData({
          ...formData,
          imageUrl: result.url,
        });
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      setError("Failed to upload image. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOnline) {
      setError(
        "Cannot save category while offline. Please check your connection.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update or create category
      let savedCategory: ProductCategory;

      if (categoryId) {
        savedCategory = await api.pim.updateCategory(categoryId, formData);
      } else {
        savedCategory = await api.pim.createCategory(
          formData as Omit<
            ProductCategory,
            "id" | "createdAt" | "updatedAt" | "level" | "path" | "productCount"
          >,
        );
      }

      // Call the submitted callback
      if (onSubmitted) {
        onSubmitted(savedCategory);
      }
    } catch (err) {
      console.error("Failed to save category:", err);
      setError(
        "Failed to save category. Please check your inputs and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    if (onCancelled) {
      onCancelled();
    }
  };

  // Loading state
  if (loading) {
    return <div className="p-4 text-center">Loading category data...</div>;
  }

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-xl font-semibold mb-6">
        {categoryId ? "Edit Category" : "Create New Category"}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {!isOnline && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          You are currently offline. Changes cannot be saved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Category Name <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                Used in URLs, auto-generated from name if empty
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border rounded"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="parentId">
                Parent Category
              </label>
              <select
                id="parentId"
                name="parentId"
                value={formData.parentId || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="">None (Root Category)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.path && category.path.length > 0
                      ? category.path.join(" > ") + " > " + category.name
                      : category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="isActive">
                Status
              </label>
              <div className="flex items-center mt-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5"
                />
                <span className="ml-2">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Image */}
        <div>
          <h3 className="text-lg font-medium mb-3">Category Image</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2">Current Image</label>
              <div className="border rounded p-4 flex items-center justify-center bg-gray-100 h-40">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Category"
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
                <div className="mt-2 text-red-500">
                  {imageUploadError.message}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {connectionQuality === "poor" ||
                connectionQuality === "critical"
                  ? "Low connection quality detected. Images will be highly compressed."
                  : connectionQuality === "fair"
                    ? "Fair connection quality. Images will be moderately compressed."
                    : "Good connection quality. Images will be optimized for quality."}
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
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
            {saving ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
