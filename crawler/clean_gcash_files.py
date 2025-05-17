import os
import json
import re

def extract_title_from_filename(filename):
    """Extract title from filename, replacing dashes with spaces."""
    match = re.search(r'help\.gcash\.com_hc_en-us_articles_\d+-(.*?)\.json', filename)
    if match:
        return match.group(1).replace('-', ' ')
    return None

def clean_title(title_text):
    """Clean up title by removing "– GCash Help Center" suffix."""
    if not title_text:
        return None
    
    if '–' in title_text:
        title_text = title_text.split('–')[0].strip()
    
    return title_text

def extract_related_articles(markdown_content):
    """Extract unique related article titles from markdown links."""
    related_articles = []
    seen = set()
    
    # Find all links to GCash help articles
    links = re.findall(r'\[(.*?)\]\((https://help\.gcash\.com/hc/en-us/articles/.*?)\)', markdown_content)
    
    for title, _ in links:
        if title.strip() and title not in seen:
            related_articles.append(title.strip())
            seen.add(title)
    
    return related_articles

def process_files(input_dir, output_dir):
    """Process all JSON files in input_dir and save cleaned versions to output_dir."""
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Process each file in the input directory
    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            input_path = os.path.join(input_dir, filename)
            
            try:
                with open(input_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                
                # Extract the markdown and metadata
                markdown_content = data.get('markdown', '')
                metadata = data.get('metadata', {})
                
                # Get title from metadata or filename
                title = clean_title(metadata.get('title', ''))
                if not title:
                    title = extract_title_from_filename(filename)
                
                # Extract related articles
                related_articles = extract_related_articles(markdown_content)
                
                # Create clean data structure
                clean_data = {
                    'title': title,
                    'content': markdown_content,
                    'related_articles': related_articles
                }
                
                # Write to output file
                output_path = os.path.join(output_dir, filename)
                with open(output_path, 'w', encoding='utf-8') as outfile:
                    json.dump(clean_data, outfile, indent=2, ensure_ascii=False)
                
                print(f"Processed: {filename}")
            
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    # Change these to your actual directory paths
    input_directory = "input_json_files"
    output_directory = "cleaned_json_files"
    
    process_files(input_directory, output_directory)
    print(f"Processing complete. Files saved to {output_directory}")