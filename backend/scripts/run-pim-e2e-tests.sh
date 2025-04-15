#!/bin/bash

# E2E Test Runner for PIM Module
# This script runs E2E tests for the PIM module with proper setup and teardown
# Follows dependency management principles and ADR guidelines

set -e

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "==================================================="
echo "    Running PIM Module E2E Tests"
echo "==================================================="
echo

# Check for required commands
if ! command -v firebase &> /dev/null; then
    echo "Firebase emulator is required but not installed."
    echo "Please install with: npm install -g firebase-tools"
    exit 1
fi

# Define test environment variables
export NODE_ENV=test
export API_BASE_URL=http://localhost:3333
export FIRESTORE_EMULATOR_HOST=localhost:8080
export STORAGE_EMULATOR_HOST=localhost:9199

# Create .env.test file for configuration
cat > .env.test << EOF
# Test environment configuration
NODE_ENV=test
FIRESTORE_EMULATOR_HOST=localhost:8080
STORAGE_EMULATOR_HOST=localhost:9199
GCP_REGION=africa-south1
GCP_PROJECT_ID=fluxori-test
GCS_BUCKET_NAME=fluxori-test-bucket
CDN_DOMAIN=test-cdn.fluxori.com
API_DOMAIN=test-api.fluxori.com
EOF

echo "Created test environment configuration"
echo

# Start the Firebase emulators in the background
echo "Starting Firebase emulators..."
firebase emulators:start --only firestore,storage &
EMULATORS_PID=$!

# Wait for emulators to start
echo "Waiting for emulators to initialize..."
sleep 5

# Clean test directory
echo "Cleaning test output directory..."
rm -rf .nyc_output
mkdir -p .nyc_output
mkdir -p coverage/pim-e2e

# Check if the PIM E2E test file exists
if [ ! -f "src/modules/pim/test/pim-e2e.spec.ts" ]; then
    echo "Error: PIM E2E test file not found at src/modules/pim/test/pim-e2e.spec.ts"
    echo "Stopping emulators..."
    kill $EMULATORS_PID
    exit 1
fi

# Run the tests
echo "Running PIM E2E tests..."
npx jest src/modules/pim/test/pim-e2e.spec.ts --config=test/jest-e2e.json --forceExit --detectOpenHandles

# Capture test result
TEST_RESULT=$?

# Stop the Firebase emulators
echo "Stopping Firebase emulators..."
kill $EMULATORS_PID

# Generate a report
if [ $TEST_RESULT -eq 0 ]; then
    echo
    echo "==================================================="
    echo "    PIM E2E Tests Completed Successfully ✅"
    echo "==================================================="
else
    echo
    echo "==================================================="
    echo "    PIM E2E Tests Failed ❌"
    echo "==================================================="
fi

# Clean up
rm .env.test

exit $TEST_RESULT