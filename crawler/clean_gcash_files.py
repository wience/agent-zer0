import os
import json
import re
from datetime import datetime

def extract_title_from_filename(filename):
    """Extract title from filename, replacing dashes with spaces."""
    # For help.gcash.com files - article format
    match = re.search(r'help\.gcash\.com_hc_en-us_articles_(\d+)-(.*?)\.json', filename)
    if match:
        article_id = match.group(1)
        title = match.group(2).replace('-', ' ')
        return article_id, title
    
    # For help.gcash.com files - sections format
    match = re.search(r'help\.gcash\.com_hc_en-us_sections_(\d+)-(.*?)\.json', filename)
    if match:
        section_id = match.group(1)
        title = match.group(2).replace('-', ' ')
        return section_id, title
    
    # For help.gcash.com files - categories format
    match = re.search(r'help\.gcash\.com_hc_en-us_categories_(\d+)-(.*?)\.json', filename)
    if match:
        category_id = match.group(1)
        title = match.group(2).replace('-', ' ')
        return category_id, title
    
    # For help.gcash.com main page
    if 'help.gcash.com_hc_en-us_.json' in filename:
        return None, "GCash Help Center Main Page"
    
    # For miniprogram files
    match = re.search(r'miniprogram\.gcash\.com_docs_miniprogram_gcash_mpdev_(.+)\.json', filename)
    if match:
        path = match.group(1)
        # Convert API_UI_Keyboard_hideKeyboard to my.hideKeyboard (API/UI/Keyboard)
        parts = path.split('_')
        if len(parts) >= 3 and parts[0] == 'API':
            # Handle API documentation
            method_name = parts[-1]
            category = '/'.join(parts[1:-1])
            return None, f"my.{method_name} ({category})"
        else:
            # Just format with slashes
            return None, path.replace('_', '/')
    
    return None, None

def extract_title_from_markdown(markdown_content):
    """Extract title from markdown content's first heading."""
    # Look for the first heading (# Title)
    match = re.search(r'^# (.*?)$', markdown_content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None

def clean_title(title_text):
    """Clean up title by removing suffixes like "– GCash Help Center" or "| Developer's Guide"."""
    if not title_text:
        return None
    
    if '–' in title_text:
        title_text = title_text.split('–')[0].strip()
    
    if '|' in title_text:
        parts = title_text.split('|')
        # If it's a miniprogram doc, the actual API name is usually the first part
        if 'Developer' in title_text:
            title_text = parts[0].strip()
        # Otherwise take the most specific part
        else:
            title_text = parts[0].strip()
    
    # Clean up common suffixes
    suffixes = [
        "GCash Help Center",
        "Help Center",
        "Developer's Guide",
        "Documentation"
    ]
    
    for suffix in suffixes:
        if title_text.endswith(suffix):
            title_text = title_text[:-len(suffix)].strip()
    
    return title_text

def extract_content(markdown_content):
    """Extract the main content from markdown, removing unnecessary sections."""
    # Remove "Back to Top" and subsequent content
    if "Back to Top" in markdown_content:
        markdown_content = markdown_content.split("Back to Top")[0]
    
    # Remove iframes
    markdown_content = re.sub(r'\[iframe\].*?(\n|$)', '', markdown_content)
    
    return markdown_content.strip()

def process_help_center_file(data, filename):
    """Process a help.gcash.com JSON file."""
    markdown_content = data.get('markdown', '')
    metadata = data.get('metadata', {})
    
    # Try to get title from different sources in order of preference:
    # 1. From the markdown first heading
    # 2. From the filename
    # 3. From the metadata
    title = extract_title_from_markdown(markdown_content)
    
    if not title:
        _, title_from_filename = extract_title_from_filename(filename)
        if title_from_filename:
            title = title_from_filename
        else:
            title = clean_title(metadata.get('title', ''))
    
    content = extract_content(markdown_content)
    
    # Extract path from URL for better identification
    url = metadata.get('url', '')
    path = ''
    if url:
        path_match = re.search(r'help\.gcash\.com/hc/en-us/(articles|sections|categories)/([^/]+)', url)
        if path_match:
            path = f"{path_match.group(1)}/{path_match.group(2)}"
    
    return {
        'title': title,
        'content': content,
        'source': url,
        'path': path,
        'type': 'help_center'
    }

def process_miniprogram_file(data, filename):
    """Process a miniprogram.gcash.com JSON file."""
    markdown_content = data.get('markdown', '')
    metadata = data.get('metadata', {})
    
    # Get title from markdown first heading which is most reliable for API docs
    title = extract_title_from_markdown(markdown_content)
    
    # If no title in markdown, try filename
    if not title:
        _, title_from_filename = extract_title_from_filename(filename)
        if title_from_filename:
            title = title_from_filename
        else:
            # Last resort, use metadata title
            title = clean_title(metadata.get('title', ''))
    
    content = extract_content(markdown_content)
    
    # Extract date if available
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', markdown_content)
    date = date_match.group(1) if date_match else None
    
    # Extract path from URL for better identification
    url = metadata.get('url', '')
    path = ''
    if url:
        path_match = re.search(r'miniprogram\.gcash\.com/docs/([^/]+)', url)
        if path_match:
            path = path_match.group(1)
    
    return {
        'title': title,
        'content': content,
        'date': date,
        'source': url,
        'path': path,
        'type': 'miniprogram'
    }

def process_files(input_dir, output_dir, pdf_output_path):
    """Process all JSON files in input_dir and save cleaned versions to output_dir."""
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    all_documents = []
    
    # Process each file in the input directory
    for filename in os.listdir(input_dir):
        if filename.endswith('.json'):
            input_path = os.path.join(input_dir, filename)
            
            try:
                with open(input_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                
                # Determine file type and process accordingly
                if 'help.gcash.com' in filename:
                    clean_data = process_help_center_file(data, filename)
                elif 'miniprogram.gcash.com' in filename:
                    clean_data = process_miniprogram_file(data, filename)
                else:
                    print(f"Unknown file type: {filename}")
                    continue
                
                # Add filename for reference
                clean_data['filename'] = filename
                
                # Save individual cleaned file
                output_path = os.path.join(output_dir, filename)
                with open(output_path, 'w', encoding='utf-8') as outfile:
                    json.dump(clean_data, outfile, indent=2, ensure_ascii=False)
                
                # Add to collection for PDF
                all_documents.append(clean_data)
                
                print(f"Processed: {filename}")
            
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    # Sort documents by type and title - make sure we handle None values properly
    all_documents.sort(key=lambda x: (x['type'], x.get('title', '') or ""))
    
    # Create markdown content for PDF
    markdown_for_pdf = "# GCash Documentation\n\n"
    markdown_for_pdf += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    # Add Table of Contents
    markdown_for_pdf += "## Table of Contents\n\n"
    
    current_type = None
    for i, doc in enumerate(all_documents):
        if doc['type'] != current_type:
            current_type = doc['type']
            section_title = "GCash Help Center" if current_type == "help_center" else "GCash Mini Program Documentation"
            markdown_for_pdf += f"### {section_title}\n\n"
        
        title = doc.get('title', f"Document {i+1}") or f"Document {i+1}"
        safe_anchor = title.lower().replace(' ', '-').replace('.', '').replace('(', '').replace(')', '')
        markdown_for_pdf += f"- [{title}](#{safe_anchor})\n"
    
    markdown_for_pdf += "\n\n"
    
    # Add document contents
    current_type = None
    for doc in all_documents:
        if doc['type'] != current_type:
            current_type = doc['type']
            section_title = "GCash Help Center" if current_type == "help_center" else "GCash Mini Program Documentation"
            markdown_for_pdf += f"# {section_title}\n\n"
        
        title = doc.get('title', "Untitled Document") or "Untitled Document"
        content = doc.get('content', "No content available.")
        source = doc.get('source', "")
        path = doc.get('path', "")
        
        safe_anchor = title.lower().replace(' ', '-').replace('.', '').replace('(', '').replace(')', '')
        markdown_for_pdf += f"## {title} {'{#' + safe_anchor + '}'}\n\n"
        
        if doc.get('date'):
            markdown_for_pdf += f"*Last updated: {doc['date']}*\n\n"
        
        if path:
            markdown_for_pdf += f"*Path: {path}*\n\n"
        
        markdown_for_pdf += f"{content}\n\n"
        
        if source:
            markdown_for_pdf += f"Source: {source}\n\n"
        
        markdown_for_pdf += "---\n\n"
    
    # Write combined markdown file for PDF generation
    with open(pdf_output_path, 'w', encoding='utf-8') as pdf_file:
        pdf_file.write(markdown_for_pdf)
    
    print(f"Combined markdown for PDF saved to: {pdf_output_path}")

if __name__ == "__main__":
    # Change these to your actual directory paths
    input_directory = "input_json_files"
    output_directory = "cleaned_json_files"
    pdf_markdown_path = "gcash_documentation.md"
    
    process_files(input_directory, output_directory, pdf_markdown_path)
    print(f"Processing complete. Files saved to {output_directory}")
    print(f"Combined markdown for PDF saved to {pdf_markdown_path}")
    print("To generate PDF, use a markdown to PDF converter like Pandoc or a similar tool.")