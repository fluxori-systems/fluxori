import React, { useState, useEffect, useMemo } from "react";

import { featureFlagsApi } from "../../api/feature-flags.api";
import { useAuth } from "../../lib/firebase/useAuth";
import {
  FeatureFlag,
  FeatureFlagType,
  Environment,
} from "../../types/feature-flags/feature-flag.types";

// Interface for the admin component
interface FeatureFlagAdminProps {
  /** Filter flags by environment */
  environment?: Environment;

  /** Initial filter by flag type */
  initialFilterType?: FeatureFlagType;

  /** Callback when a flag is updated */
  onFlagUpdated?: (flag: FeatureFlag) => void;
}

/**
 * Admin interface for managing feature flags
 */
export const FeatureFlagAdmin: React.FC<FeatureFlagAdminProps> = ({
  environment,
  initialFilterType,
  onFlagUpdated,
}) => {
  // State
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FeatureFlagType | "all">(
    initialFilterType || "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Fetch flags on mount
  useEffect(() => {
    fetchFlags();
  }, [environment]);

  // Handle fetching flags
  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const flags = await featureFlagsApi.getAllFlags(environment);
      setFlags(flags);
    } catch (err) {
      setError("Failed to load feature flags");
      console.error("Error fetching feature flags:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle a flag
  const handleToggleFlag = async (id: string, currentState: boolean) => {
    try {
      const updatedFlag = await featureFlagsApi.toggleFlag(id, !currentState);

      // Update local state
      setFlags(flags.map((flag) => (flag.id === id ? updatedFlag : flag)));

      // Notify parent component
      if (onFlagUpdated) {
        onFlagUpdated(updatedFlag);
      }
    } catch (err) {
      setError("Failed to toggle feature flag");
      console.error("Error toggling feature flag:", err);
    }
  };

  // Filter flags based on search and type filter
  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      // Apply type filter
      if (filterType !== "all" && flag.type !== filterType) {
        return false;
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          flag.key.toLowerCase().includes(query) ||
          flag.name.toLowerCase().includes(query) ||
          (flag.description && flag.description.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [flags, filterType, searchQuery]);

  // Sort flags by modification date
  const sortedFlags = useMemo(() => {
    return [...filteredFlags].sort((a, b) => {
      const dateA = a.lastModifiedAt ? new Date(a.lastModifiedAt).getTime() : 0;
      const dateB = b.lastModifiedAt ? new Date(b.lastModifiedAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  }, [filteredFlags]);

  // Determine if user can edit flags
  const canEditFlags = user?.role === "admin" || user?.role === "manager";

  // Render loading state
  if (isLoading) {
    return <div>Loading feature flags...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchFlags}>Retry</button>
      </div>
    );
  }

  return (
    <div className="feature-flag-admin">
      <div className="feature-flag-controls">
        <h2>Feature Flags</h2>

        <div className="feature-flag-filters">
          {/* Search input */}
          <input
            type="text"
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as FeatureFlagType | "all")
            }
            className="type-filter"
          >
            <option value="all">All Types</option>
            <option value={FeatureFlagType.BOOLEAN}>Boolean</option>
            <option value={FeatureFlagType.PERCENTAGE}>Percentage</option>
            <option value={FeatureFlagType.USER_TARGETED}>User Targeted</option>
            <option value={FeatureFlagType.ORGANIZATION_TARGETED}>
              Organization Targeted
            </option>
            <option value={FeatureFlagType.ENVIRONMENT_TARGETED}>
              Environment Targeted
            </option>
            <option value={FeatureFlagType.SCHEDULED}>Scheduled</option>
          </select>

          {/* Refresh button */}
          <button onClick={fetchFlags} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      {/* Flag list */}
      {sortedFlags.length === 0 ? (
        <div className="no-flags">
          No feature flags found.{" "}
          {!searchQuery &&
            !filterType &&
            "Create your first feature flag to get started."}
        </div>
      ) : (
        <div className="feature-flag-list">
          {sortedFlags.map((flag) => (
            <div
              key={flag.id}
              className={`feature-flag-item ${flag.enabled ? "enabled" : "disabled"}`}
            >
              <div className="flag-header">
                <div className="flag-info">
                  <h3>{flag.name}</h3>
                  <code className="flag-key">{flag.key}</code>
                  <span className="flag-type">{flag.type}</span>
                </div>

                {canEditFlags && (
                  <div className="flag-actions">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        onChange={() => handleToggleFlag(flag.id, flag.enabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                )}
              </div>

              {flag.description && (
                <p className="flag-description">{flag.description}</p>
              )}

              <div className="flag-details">
                {/* Type-specific details */}
                {flag.type === FeatureFlagType.PERCENTAGE && (
                  <div className="flag-percentage">
                    Rollout: {flag.percentage}%
                  </div>
                )}

                {flag.type === FeatureFlagType.ENVIRONMENT_TARGETED &&
                  flag.environments && (
                    <div className="flag-environments">
                      Environments: {flag.environments.join(", ")}
                    </div>
                  )}

                {flag.tags && flag.tags.length > 0 && (
                  <div className="flag-tags">
                    {flag.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {flag.lastModifiedAt && (
                  <div className="flag-last-modified">
                    Last modified:{" "}
                    {new Date(flag.lastModifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
