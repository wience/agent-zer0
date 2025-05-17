import os
import json
import re

def extract_title_from_filename(filename):
    """Extract title from filename, replacing dashes with spaces."""
    match = re.search(r'help\.gcash\.com_hc_en-us_articles_(\d+)-(.*?)\.json', filename)
    if match:
        article_id = match.group(1)
        title = match.group(2).replace('-', ' ')
        return article_id, title
    return None, None

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
    
    for title, url in links:
        if title.strip() and title not in seen:
            related_articles.append({
                "title": title.strip(),
                "url": url.strip()
            })
            seen.add(title)
    
    return related_articles

def extract_category(markdown_content):
    """Extract the category/section of the article."""
    section_match = re.search(r'## Articles in this section\n\n(.*?)(?=\n\n## |$)', markdown_content, re.DOTALL)
    if section_match:
        section_text = section_match.group(1)
        # Extract category names from list items
        categories = []
        for line in section_text.split('\n'):
            if line.startswith('- ['):
                category_match = re.search(r'\[(.*?)\]', line)
                if category_match:
                    categories.append(category_match.group(1))
        return categories
    return []

def extract_images(markdown_content):
    """Extract image URLs from markdown content."""
    images = []
    # Match markdown image syntax ![alt text](url)
    for match in re.finditer(r'!\[(.*?)\]\((.*?)\)', markdown_content):
        alt_text = match.group(1)
        url = match.group(2)
        images.append({
            "alt_text": alt_text,
            "url": url
        })
    
    # Also match HTML image tags
    for match in re.finditer(r'<img.*?src=[\'"]([^\'"]*)[\'"].*?>', markdown_content):
        url = match.group(1)
        images.append({
            "alt_text": "",
            "url": url
        })
    
    return images

def extract_jump_links(markdown_content):
    """Extract jump-to navigation links."""
    jump_match = re.search(r'Jump to:\n\n(.*?)(?=\n\n\w|$)', markdown_content, re.DOTALL)
    if jump_match:
        jump_text = jump_match.group(1)
        jump_links = []
        for line in jump_text.split('\n'):
            link_match = re.search(r'\[(.*?)\]\((.*?)\)', line)
            if link_match:
                jump_links.append({
                    "title": link_match.group(1),
                    "anchor": link_match.group(2)
                })
        return jump_links
    return []

def extract_article_id(markdown_content):
    """Extract article ID from the bottom of the page."""
    id_match = re.search(r'\n(\d+)\n\nBack to Top', markdown_content)
    if id_match:
        return id_match.group(1)
    return None

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
                
                # Get article ID from filename
                article_id_from_file, title_from_file = extract_title_from_filename(filename)
                
                # Get title from metadata or filename
                title = clean_title(metadata.get('title', ''))
                if not title:
                    title = title_from_file
                
                # Get article ID from markdown or filename
                article_id = extract_article_id(markdown_content) or article_id_from_file
                
                # Extract additional information
                related_articles = extract_related_articles(markdown_content)
                categories = extract_category(markdown_content)
                images = extract_images(markdown_content)
                jump_links = extract_jump_links(markdown_content)
                
                # Create clean data structure
                clean_data = {
                    'article_id': article_id,
                    'title': title,
                    'url': metadata.get('url', ''),
                    'content': markdown_content,
                    'categories': categories,
                    'related_articles': related_articles,
                    'images': images,
                    'jump_links': jump_links,
                    'description': metadata.get('description', '')
                }
                
                # Extract any product-specific information for financial or insurance products
                if 'GFunds' in title or 'GInsure' in title or 'GLoan' in title:
                    # Try to extract tables with pricing/investment info
                    tables = []
                    table_matches = re.finditer(r'\|(.*?)\|(?:\n\|(.*?)\|)+', markdown_content, re.DOTALL)
                    for i, match in enumerate(table_matches):
                        tables.append(match.group(0))
                    
                    if tables:
                        clean_data['product_tables'] = tables
                
                # Extract eligibility information if present
                eligibility_match = re.search(r'## Eligibility\n\n(.*?)(?=\n\n##|$)', markdown_content, re.DOTALL)
                if eligibility_match:
                    clean_data['eligibility'] = eligibility_match.group(1).strip()
                
                # Extract coverage information if present
                coverage_match = re.search(r'## Coverage\n\n(.*?)(?=\n\n##|$)', markdown_content, re.DOTALL)
                if coverage_match:
                    clean_data['coverage'] = coverage_match.group(1).strip()
                
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