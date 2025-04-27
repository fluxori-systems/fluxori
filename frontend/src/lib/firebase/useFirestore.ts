"use client";

/**
 * Custom hook for Firestore operations
 *
 * This hook provides a consistent interface for Firestore operations
 * with React-friendly state management.
 */

import { useState, useCallback, useEffect } from "react";

import { useFirebase } from "../contexts/firebase-context";
import {
  FirestoreService,
  TenantFirestoreService,
} from "../lib/firebase/firestore.service";
import {
  BaseEntity,
  TenantEntity,
  QueryOptions,
  PaginatedResponse,
} from "../types/core/entity.types";

/**
 * State interface for the Firestore hook
 */
interface FirestoreState<T extends BaseEntity> {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  items: T[];
  paginatedData: PaginatedResponse<T> | null;
}

/**
 * Custom hook for Firestore operations
 * @param collectionName Firestore collection name
 * @param isTenantCollection Whether this is a tenant-scoped collection
 * @returns An object with state and methods for Firestore operations
 */
export function useFirestore<T extends BaseEntity>(
  collectionName: string,
  isTenantCollection = false,
) {
  // Get current user from Firebase context
  const { user } = useFirebase();

  // Create appropriate service based on collection type
  const service = isTenantCollection
    ? new TenantFirestoreService<T & TenantEntity>(collectionName)
    : new FirestoreService<T>(collectionName);

  // Initialize state
  const [state, setState] = useState<FirestoreState<T>>({
    isLoading: false,
    error: null,
    data: null,
    items: [],
    paginatedData: null,
  });

  // Helper to set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState((prevState) => ({ ...prevState, isLoading, error: null }));
  }, []);

  // Helper to set error state
  const setError = useCallback((error: Error) => {
    setState((prevState) => ({ ...prevState, error, isLoading: false }));
  }, []);

  // Get a document by ID
  const getById = useCallback(
    async (id: string) => {
      setLoading(true);

      try {
        const result = await service.getById(id);
        setState((prevState) => ({
          ...prevState,
          data: result,
          isLoading: false,
        }));
        return result;
      } catch (error) {
        setError(
          error instanceof Error ? error : new Error("Failed to get document"),
        );
        return null;
      }
    },
    [service, setLoading, setError],
  );

  // Get all documents
  const getAll = useCallback(
    async (options?: QueryOptions) => {
      setLoading(true);

      try {
        // If this is a tenant collection and we have a current user with an organization
        if (isTenantCollection && user?.organizationId) {
          const tenantService = service as TenantFirestoreService<
            T & TenantEntity
          >;
          const results = await tenantService.getAllForOrganization(
            user.organizationId,
            options,
          );
          setState((prevState) => ({
            ...prevState,
            items: results,
            isLoading: false,
          }));
          return results;
        } else {
          // For non-tenant collections or when no user is logged in
          const results = await service.getAll(options);
          setState((prevState) => ({
            ...prevState,
            items: results,
            isLoading: false,
          }));
          return results;
        }
      } catch (error) {
        setError(
          error instanceof Error ? error : new Error("Failed to get documents"),
        );
        return [];
      }
    },
    [service, user, isTenantCollection, setLoading, setError],
  );

  // Get paginated documents
  const getPaginated = useCallback(
    async (options?: QueryOptions) => {
      setLoading(true);

      try {
        // If this is a tenant collection and we have a current user with an organization
        if (isTenantCollection && user?.organizationId) {
          const tenantService = service as TenantFirestoreService<
            T & TenantEntity
          >;
          const results = await tenantService.getPaginatedForOrganization(
            user.organizationId,
            options,
          );
          setState((prevState) => ({
            ...prevState,
            paginatedData: results,
            items: results.data,
            isLoading: false,
          }));
          return results;
        } else {
          // For non-tenant collections or when no user is logged in
          const results = await service.getPaginated(options);
          setState((prevState) => ({
            ...prevState,
            paginatedData: results,
            items: results.data,
            isLoading: false,
          }));
          return results;
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error
            : new Error("Failed to get paginated documents"),
        );
        return {
          data: [],
          meta: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
    },
    [service, user, isTenantCollection, setLoading, setError],
  );

  // Create a document
  const create = useCallback(
    async (data: Omit<T, "id">, customId?: string) => {
      setLoading(true);

      try {
        // If this is a tenant collection and we have a current user with an organization
        if (isTenantCollection && user?.organizationId) {
          const tenantService = service as TenantFirestoreService<
            T & TenantEntity
          >;
          // We need to omit organizationId from the type since it will be added by the service
          const { organizationId, ...rest } = data as any;
          const result = await tenantService.createForOrganization(
            user.organizationId,
            rest as Omit<T & TenantEntity, "id" | "organizationId">,
            customId,
          );
          setState((prevState) => ({
            ...prevState,
            data: result as unknown as T,
            isLoading: false,
          }));
          return result as unknown as T;
        } else {
          // For non-tenant collections or when no user is logged in
          const result = await service.create(data, customId);
          setState((prevState) => ({
            ...prevState,
            data: result,
            isLoading: false,
          }));
          return result;
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error
            : new Error("Failed to create document"),
        );
        return null;
      }
    },
    [service, user, isTenantCollection, setLoading, setError],
  );

  // Update a document
  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      setLoading(true);

      try {
        const result = await service.update(id, data);
        setState((prevState) => ({
          ...prevState,
          data: result,
          isLoading: false,
        }));
        return result;
      } catch (error) {
        setError(
          error instanceof Error
            ? error
            : new Error("Failed to update document"),
        );
        return null;
      }
    },
    [service, setLoading, setError],
  );

  // Delete a document
  const remove = useCallback(
    async (id: string, softDelete = true) => {
      setLoading(true);

      try {
        const result = await service.delete(id, softDelete);
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
          // If we've soft-deleted the item that was in data, clear it
          data: prevState.data?.id === id ? null : prevState.data,
          // Remove the item from items array
          items: prevState.items.filter((item) => item.id !== id),
        }));
        return result;
      } catch (error) {
        setError(
          error instanceof Error
            ? error
            : new Error("Failed to delete document"),
        );
        return false;
      }
    },
    [service, setLoading, setError],
  );

  // Reset state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      items: [],
      paginatedData: null,
    });
  }, []);

  return {
    ...state,
    getById,
    getAll,
    getPaginated,
    create,
    update,
    remove,
    reset,
  };
}
