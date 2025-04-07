#!/bin/bash
# Script to run the full Azure to GCS migration with validation
# This script handles the migration process and validates the results

set -e

# Configuration
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$SCRIPT_DIR/logs"
MIGRATION_LOG="$LOG_DIR/migration_$TIMESTAMP.log"
VALIDATION_LOG="$LOG_DIR/validation_$TIMESTAMP.log"
RESULTS_JSON="$SCRIPT_DIR/migration-validation-results.json"
ENV_FILE="$SCRIPT_DIR/.env"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  echo "Please create an .env file with the required environment variables:"
  echo "AZURE_CONNECTION_STRING=<your-azure-connection-string>"
  echo "GCP_PROJECT_ID=<your-gcp-project-id>"
  echo "FIRESTORE_DATABASE_ID=fluxori-db"
  echo "UPDATE_REFERENCES=true"
  echo "CHECK_DB_REFERENCES=true"
  exit 1
fi

echo "======= Starting Storage Migration Process ======="
echo "Time: $(date)"
echo "Log files:"
echo "  Migration: $MIGRATION_LOG"
echo "  Validation: $VALIDATION_LOG"
echo ""

# Stage 1: Run Migration
echo "Stage 1: Running Azure to GCS migration..."
node "$SCRIPT_DIR/azure-to-gcs.js" | tee "$MIGRATION_LOG"
MIGRATION_EXIT_CODE=${PIPESTATUS[0]}

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
  echo "Migration failed with exit code $MIGRATION_EXIT_CODE"
  echo "Check log for details: $MIGRATION_LOG"
  exit $MIGRATION_EXIT_CODE
fi

echo "Migration completed. Waiting 30 seconds before validation..."
sleep 30  # Wait for any pending operations to complete

# Stage 2: Run Validation
echo "Stage 2: Running migration validation..."
node "$SCRIPT_DIR/validate-migration.js" | tee "$VALIDATION_LOG"
VALIDATION_EXIT_CODE=${PIPESTATUS[0]}

if [ $VALIDATION_EXIT_CODE -ne 0 ]; then
  echo "Validation failed with exit code $VALIDATION_EXIT_CODE"
  echo "Check log for details: $VALIDATION_LOG"
  echo "Validation results: $RESULTS_JSON"
  exit $VALIDATION_EXIT_CODE
fi

# Stage 3: Analyze Results
echo "Stage 3: Analyzing migration results..."

if [ -f "$RESULTS_JSON" ]; then
  # Extract stats using grep and sed (basic parsing)
  TOTAL_FILES=$(grep -o '"totalFiles":[0-9]*' "$RESULTS_JSON" | sed 's/"totalFiles"://')
  MATCHED_FILES=$(grep -o '"matchedFiles":[0-9]*' "$RESULTS_JSON" | sed 's/"matchedFiles"://')
  MISSING_FILES=$(grep -o '"missingFiles":[0-9]*' "$RESULTS_JSON" | sed 's/"missingFiles"://')
  INTEGRITY_FAILED=$(grep -o '"integrityFailed":[0-9]*' "$RESULTS_JSON" | sed 's/"integrityFailed"://')
  
  echo "Migration Summary:"
  echo "  Total files: $TOTAL_FILES"
  echo "  Matched files: $MATCHED_FILES"
  echo "  Missing files: $MISSING_FILES"
  echo "  Integrity issues: $INTEGRITY_FAILED"
  
  # Check if any references need updating
  OLD_REFS=$(grep -o '"oldReferences":[0-9]*' "$RESULTS_JSON" | sed 's/"oldReferences"://')
  if [ "$OLD_REFS" -gt 0 ]; then
    echo "  WARNING: $OLD_REFS file references in the database still need updating"
    echo "  Consider running the migration script again with UPDATE_REFERENCES=true"
  else
    echo "  Database references are up to date"
  fi
  
  # Calculate success percentage
  if [ "$TOTAL_FILES" -gt 0 ]; then
    SUCCESS_PERCENT=$(awk "BEGIN {print ($MATCHED_FILES / $TOTAL_FILES) * 100}")
    echo "  Success rate: $SUCCESS_PERCENT%"
  fi
else
  echo "Warning: Results file not found: $RESULTS_JSON"
fi

echo "======= Storage Migration Process Complete ======="
echo "Time: $(date)"

# Return appropriate exit code
if [ "$MISSING_FILES" -gt 0 ] || [ "$INTEGRITY_FAILED" -gt 0 ]; then
  echo "Migration completed with issues. Check logs for details."
  exit 1
else
  echo "Migration completed successfully!"
  exit 0
fi