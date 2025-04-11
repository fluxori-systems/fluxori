#!/bin/bash
# Repository Migration Script
# This script migrates all repositories in the codebase to use the new unified repository pattern

set -e

BACKEND_DIR="/home/tarquin_stapa/fluxori/backend"
SOURCE_PATTERN="FirestoreBaseRepository"
TARGET_PATTERN="UnifiedFirestoreRepository"

cd $BACKEND_DIR

# First, ensure the migration tools are compiled
echo "Compiling migration tools..."
npx tsc src/common/repositories/migration-tools/update-repository-imports.ts --outDir dist/migration-tools/

# Now run the migration script
echo "Running repository migration..."
node dist/migration-tools/update-repository-imports.js

# Update repository imports throughout the codebase
echo "Updating imports across the codebase..."
find src -type f -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" | xargs grep -l "$SOURCE_PATTERN" | while read file; do
    echo "Processing $file"
    sed -i "s|$SOURCE_PATTERN|$TARGET_PATTERN|g" "$file"
    
    # Calculate relative path to unified repository
    rel_path=$(python -c "import os.path; print(os.path.relpath('src/common/repositories', os.path.dirname('$file')))")
    sed -i "s|import { UnifiedFirestoreRepository } from '.*firestore-base.repository';|import { UnifiedFirestoreRepository } from '$rel_path/unified-firestore.repository';|g" "$file"
done

echo "Migration complete. Please review the changes and run tests."