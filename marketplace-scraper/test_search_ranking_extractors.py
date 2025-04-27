"""
Test script that validates the search ranking extractor class definitions.

This script directly examines the implemented search ranking extractor files
to ensure they're properly defined.
"""

import re
import os

def test_extractor_files():
    """Test that all search ranking extractor files exist and have the expected class structure."""
    print("Testing search ranking extractor files...")
    
    # First check the base extractor
    base_extractor_path = "/home/tarquin_stapa/fluxori/marketplace-scraper/src/common/extractors/search_ranking_extractor.py"
    if not os.path.exists(base_extractor_path):
        print(f"ERROR: Base extractor file not found at {base_extractor_path}")
        return False
    
    with open(base_extractor_path, 'r') as f:
        base_content = f.read()
    
    if not re.search(r'class\s+SearchRankingExtractor\s*\(\s*ABC\s*\):', base_content):
        print(f"ERROR: SearchRankingExtractor base class not found or not defined as ABC")
        return False
    
    print("✓ Base SearchRankingExtractor looks good!")
    
    # Define the expected files and classes
    extractors = [
        {
            "marketplace": "Amazon SA",
            "path": "src/marketplaces/amazon/extractors/search_ranking_extractor.py",
            "class_name": "AmazonSearchRankingExtractor"
        },
        {
            "marketplace": "Bob Shop",
            "path": "src/marketplaces/bob_shop/extractors/search_ranking_extractor.py",
            "class_name": "BobShopSearchRankingExtractor"
        },
        {
            "marketplace": "Makro",
            "path": "src/marketplaces/makro/extractors/search_ranking_extractor.py",
            "class_name": "MakroSearchRankingExtractor"
        },
        {
            "marketplace": "Loot",
            "path": "src/marketplaces/loot/extractors/search_ranking_extractor.py",
            "class_name": "LootSearchRankingExtractor"
        }
    ]
    
    # Check each file
    success = True
    for extractor in extractors:
        file_path = os.path.join("/home/tarquin_stapa/fluxori/marketplace-scraper", extractor["path"])
        
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"ERROR: {extractor['marketplace']} extractor file not found at {file_path}")
            success = False
            continue
        
        # Read file content
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check for class definition
        class_pattern = r'class\s+' + re.escape(extractor["class_name"]) + r'\s*\(\s*SearchRankingExtractor\s*\):'
        if not re.search(class_pattern, content):
            print(f"ERROR: {extractor['class_name']} class not found in {file_path}")
            success = False
            continue
        
        # Check for required methods
        required_methods = [
            "_extract_total_results",
            "_extract_ranked_products",
            "_extract_seller_count",
            "_detect_sponsored_result",
            "_calculate_marketplace_specific_score"
        ]
        
        for method in required_methods:
            method_pattern = r'def\s+' + re.escape(method) + r'\s*\('
            if not re.search(method_pattern, content):
                print(f"ERROR: Required method '{method}' not found in {extractor['class_name']}")
                success = False
        
        print(f"✓ {extractor['marketplace']} extractor looks good!")
    
    if success:
        print("\nAll search ranking extractors validation passed!")
    else:
        print("\nSome extractors have issues. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    test_extractor_files()