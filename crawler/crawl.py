from firecrawl import FirecrawlApp, JsonConfig
from pydantic import BaseModel, Field
import json
from tqdm import tqdm
import time

# Initialize the FirecrawlApp with your API key
app = FirecrawlApp(api_key="fc-5535e4c895bc4e7b9484991459ddcf37")  # Replace with your actual API key

# Define schema for GCash help articles
class GCashHelpSchema(BaseModel):
    title: str = Field(description="The title of the help article")
    category: str = Field(description="The category or section the article belongs to")
    main_content: str = Field(description="The main content or body of the help article")
    faqs: list = Field(description="Frequently asked questions if present", default=[])

# Configure extraction
json_config = JsonConfig(
    extractionSchema=GCashHelpSchema.model_json_schema(),
    mode="llm-extraction",
    pageOptions={"onlyMainContent": True}
)

def scrape_urls(urls):
    """Scrape multiple URLs and return all results"""
    all_results = {}
    
    # Process each URL
    for url in tqdm(urls, desc="Scraping URLs"):
        try:
            # Extract data from the URL
            result = app.scrape_url(
                url,
                formats=["json"],
                json_options=json_config
            )
            
            # Add to results dictionary with URL as key
            all_results[url] = result
            
            # Add a small delay to avoid rate limiting
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
            all_results[url] = {"error": str(e)}
    
    return all_results

def main():
    # Read URLs from file
    with open('paste.txt', 'r') as file:
        content = file.read()
    
    # Extract URLs (assuming one URL per line)
    urls = [line.strip() for line in content.split('\n') 
            if line.strip() and line.strip().startswith("http")]
    
    print(f"Found {len(urls)} URLs to scrape")
    
    # Scrape all URLs
    results = scrape_urls(urls)
    
    # Save all results to a single JSON file
    with open('gcash_help_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to gcash_help_data.json")

if __name__ == "__main__":
    main()