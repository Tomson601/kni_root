import markdown
import os
from jinja2 import Template
from datetime import datetime

POSTS_DIR = 'blog/posts'
OUTPUT_DIR = 'blog'
TEMPLATE_PATH = 'templates/blog_post_template.html'

def load_template():
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        return Template(f.read())

def parse_metadata_and_content(md_text):
    lines = md_text.splitlines()
    metadata = {}
    content_lines = []
    reading_meta = True

    for line in lines:
        if reading_meta and line.startswith('---'):
            continue
        elif reading_meta and ':' in line:
            key, value = line.split(':', 1)
            metadata[key.strip()] = value.strip().strip('"')
        else:
            reading_meta = False
            content_lines.append(line)

    content = '\n'.join(content_lines)
    return metadata, content

def generate_blog():
    template = load_template()
    posts = []

    for filename in sorted(os.listdir(POSTS_DIR), reverse=True):
        if filename.endswith('.md'):
            filepath = os.path.join(POSTS_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                md_text = f.read()
            meta, md_content = parse_metadata_and_content(md_text)
            html_content = markdown.markdown(md_content)
            html = template.render(title=meta['title'], date=meta['date'], content=html_content)
            slug = filename.replace('.md', '.html')
            out_path = os.path.join(OUTPUT_DIR, slug)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(html)
            posts.append((meta['title'], meta['date'], slug))

    # Generate blog index
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write('<h1>Blog</h1>\n<ul>')
        for title, date, slug in posts:
            f.write(f'<li><a href="{slug}">{title}</a> <em>({date})</em></li>')
        f.write('</ul>')

if __name__ == "__main__":
    generate_blog()
