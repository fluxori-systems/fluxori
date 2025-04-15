#!/bin/bash

# Script to run tests for the PIM module

echo "Running PIM Module tests..."
echo "==========================="

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Run Jest with all PIM tests
npx jest --config=./test/jest-e2e.json src/modules/pim/test --runInBand --verbose

# Log test result
if [ $? -eq 0 ]; then
  echo "✅ PIM tests passed successfully"
else
  echo "❌ Some PIM tests failed"
  exit 1
fi

echo ""
echo "Running specific component tests..."
echo "=================================="

# Run product variant tests specifically
echo "Testing Product Variant System..."
npx jest --config=./test/jest-e2e.json src/modules/pim/test/product-variant.service.spec.ts --verbose

if [ $? -eq 0 ]; then
  echo "✅ Product Variant tests passed successfully"
else
  echo "❌ Product Variant tests failed"
  exit 1
fi

echo ""
echo "All PIM tests completed"