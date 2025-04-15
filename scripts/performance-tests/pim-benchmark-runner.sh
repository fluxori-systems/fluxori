#\!/bin/bash

# Run PIM performance benchmarks with different configurations

# Set the working directory
cd "$(dirname "$0")"

# Create results directory
mkdir -p ./results

# Run product benchmark with different catalog sizes
echo "Running product benchmark with different catalog sizes..."
node pim-benchmark.js --catalog-size small --output ./results
node pim-benchmark.js --catalog-size medium --output ./results

# Run product benchmark with different network conditions
echo "Running product benchmark with different network conditions..."
node pim-benchmark.js --network excellent --output ./results
node pim-benchmark.js --network fair --output ./results
node pim-benchmark.js --network poor --output ./results

# Run product benchmark with load shedding simulation
echo "Running product benchmark with load shedding simulation..."
node pim-benchmark.js --load-shedding 0 --output ./results
node pim-benchmark.js --load-shedding 2 --output ./results
node pim-benchmark.js --load-shedding 6 --output ./results

# Run variant benchmark with different configurations
echo "Running variant benchmark with different configurations..."
node pim-benchmark-variant.js --parent-size small --variant-complexity simple --output ./results
node pim-benchmark-variant.js --parent-size medium --variant-complexity medium --output ./results

# Run variant benchmark with different network conditions
echo "Running variant benchmark with different network conditions..."
node pim-benchmark-variant.js --network excellent --output ./results
node pim-benchmark-variant.js --network poor --output ./results

# Run variant benchmark with load shedding simulation
echo "Running variant benchmark with load shedding simulation..."
node pim-benchmark-variant.js --load-shedding 0 --output ./results
node pim-benchmark-variant.js --load-shedding 4 --output ./results

# Generate comparison report
echo "Generating comparison report..."
node generate-comparison-report.js --input ./results --output ./results

echo "All benchmarks completed\!"
