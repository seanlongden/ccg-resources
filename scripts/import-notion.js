const fs = require('fs');
const path = require('path');

const NOTION_EXPORT_PATH = '/Users/seanlongden/Downloads/3.0 Resources/3 0 Closing Clients Group Resource Library';
const OUTPUT_PATH = path.join(__dirname, '../content');

// Clean up Notion's filename format (remove the hash)
function cleanFileName(name) {
  // Remove the hash suffix like " 36d42323e54e4a1e9ff50c8365b689a0"
  return name.replace(/\s+[a-f0-9]{32}$/i, '').replace(/\.md$/, '');
}

// Create a URL-friendly slug
function createSlug(name) {
  return cleanFileName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Parse markdown content and clean up Notion-specific elements
function parseMarkdownContent(content, basePath) {
  // Remove the title if it's duplicated (Notion exports title twice sometimes)
  const lines = content.split('\n');
  let cleanedContent = content;

  // Convert Notion internal links to our format
  // [Link Text](folder/file%20name%20hash.md) -> [Link Text](/resources/slug)
  cleanedContent = cleanedContent.replace(
    /\[([^\]]+)\]\(([^)]+\.md)\)/g,
    (match, text, link) => {
      const decodedLink = decodeURIComponent(link);
      const slug = createSlug(path.basename(decodedLink));
      return `[${text}](/resources/${slug})`;
    }
  );

  // Convert Notion callouts/asides
  cleanedContent = cleanedContent.replace(/<aside>/g, '<div class="callout">');
  cleanedContent = cleanedContent.replace(/<\/aside>/g, '</div>');

  return cleanedContent;
}

// Recursively scan directory and build content structure
function scanDirectory(dirPath, parentSlug = '') {
  const items = [];

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return items;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Separate files and directories
  const files = entries.filter(e => e.isFile() && e.name.endsWith('.md'));
  const dirs = entries.filter(e => e.isDirectory());

  // Process markdown files
  for (const file of files) {
    const name = cleanFileName(file.name);
    const slug = createSlug(file.name);
    const filePath = path.join(dirPath, file.name);

    // Skip template pages
    if (name.toLowerCase().includes('template page')) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsedContent = parseMarkdownContent(content, dirPath);

      // Extract title from first H1
      const titleMatch = parsedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : name;

      items.push({
        type: 'page',
        title: title,
        slug: slug,
        fullSlug: parentSlug ? `${parentSlug}/${slug}` : slug,
        content: parsedContent,
        fileName: file.name,
      });
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err.message);
    }
  }

  // Process subdirectories
  for (const dir of dirs) {
    const name = cleanFileName(dir.name);
    const slug = createSlug(dir.name);
    const dirFullPath = path.join(dirPath, dir.name);

    // Skip hidden/system directories
    if (dir.name.startsWith('.')) continue;

    // Find the matching .md file for this directory (the section overview)
    const matchingMdFile = files.find(f => cleanFileName(f.name) === name);
    let sectionContent = '';
    let sectionTitle = name;

    if (matchingMdFile) {
      try {
        const content = fs.readFileSync(path.join(dirPath, matchingMdFile.name), 'utf-8');
        sectionContent = parseMarkdownContent(content, dirPath);
        const titleMatch = sectionContent.match(/^#\s+(.+)$/m);
        if (titleMatch) sectionTitle = titleMatch[1];
      } catch (err) {
        console.error(`Error reading section file:`, err.message);
      }
    }

    // Recursively scan subdirectory
    const children = scanDirectory(dirFullPath, parentSlug ? `${parentSlug}/${slug}` : slug);

    items.push({
      type: 'section',
      title: sectionTitle,
      slug: slug,
      fullSlug: parentSlug ? `${parentSlug}/${slug}` : slug,
      content: sectionContent,
      children: children,
      dirName: dir.name,
    });
  }

  return items;
}

// Main sections we want to highlight
const MAIN_SECTIONS = [
  'Closing Clients $30K Month Roadmap',
  'Key Resources',
  'Exclusive Offers & Discounts',
  'Group Events & Webinar Vault',
  'Mindset & Accountability',
  'Offers, Guarantees, Case Studies',
  'Agency Set-Up',
  'Cold Email',
  'LinkedIn',
  'Cold Calling',
  'Sales',
  'Onboarding',
  'Fulfilment',
  'Hiring And Team Management',
  'Scaling',
  'Automations',
];

// Build the navigation structure
function buildNavigation(items) {
  const nav = [];

  for (const sectionName of MAIN_SECTIONS) {
    const section = items.find(item =>
      item.type === 'section' &&
      cleanFileName(item.dirName || '') === sectionName
    );

    if (section) {
      nav.push({
        title: section.title,
        slug: section.slug,
        fullSlug: section.fullSlug,
        children: section.children
          .filter(c => c.type === 'page' || c.type === 'section')
          .map(c => ({
            title: c.title,
            slug: c.slug,
            fullSlug: c.fullSlug,
            type: c.type,
            childCount: c.children ? c.children.length : 0,
          }))
          .slice(0, 20), // Limit children shown in nav
      });
    }
  }

  return nav;
}

// Flatten all pages for easy lookup
function flattenPages(items, pages = {}) {
  for (const item of items) {
    if (item.type === 'page') {
      pages[item.fullSlug] = {
        title: item.title,
        slug: item.slug,
        fullSlug: item.fullSlug,
        content: item.content,
      };
    } else if (item.type === 'section') {
      // Also create a page entry for section overviews
      if (item.content) {
        pages[item.fullSlug] = {
          title: item.title,
          slug: item.slug,
          fullSlug: item.fullSlug,
          content: item.content,
          isSection: true,
          children: item.children.map(c => ({
            title: c.title,
            slug: c.slug,
            fullSlug: c.fullSlug,
            type: c.type,
          })),
        };
      }

      if (item.children) {
        flattenPages(item.children, pages);
      }
    }
  }
  return pages;
}

// Run the import
console.log('Starting Notion import...');
console.log(`Source: ${NOTION_EXPORT_PATH}`);
console.log(`Output: ${OUTPUT_PATH}`);

// Scan the export directory
const allContent = scanDirectory(NOTION_EXPORT_PATH);

console.log(`Found ${allContent.length} top-level items`);

// Build navigation
const navigation = buildNavigation(allContent);
console.log(`Built navigation with ${navigation.length} main sections`);

// Flatten pages
const pages = flattenPages(allContent);
const pageCount = Object.keys(pages).length;
console.log(`Flattened ${pageCount} pages`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Write navigation
fs.writeFileSync(
  path.join(OUTPUT_PATH, 'navigation.json'),
  JSON.stringify(navigation, null, 2)
);
console.log('Wrote navigation.json');

// Write pages (split into chunks to avoid huge files)
const PAGES_PER_FILE = 50;
const pageEntries = Object.entries(pages);
const chunks = [];

for (let i = 0; i < pageEntries.length; i += PAGES_PER_FILE) {
  const chunk = Object.fromEntries(pageEntries.slice(i, i + PAGES_PER_FILE));
  const chunkIndex = Math.floor(i / PAGES_PER_FILE);
  chunks.push(chunkIndex);

  fs.writeFileSync(
    path.join(OUTPUT_PATH, `pages-${chunkIndex}.json`),
    JSON.stringify(chunk, null, 2)
  );
}

// Write index of all page slugs
const pageIndex = pageEntries.map(([slug, page]) => ({
  slug,
  title: page.title,
  isSection: page.isSection || false,
  chunk: Math.floor(pageEntries.indexOf(pageEntries.find(e => e[0] === slug)) / PAGES_PER_FILE),
}));

fs.writeFileSync(
  path.join(OUTPUT_PATH, 'page-index.json'),
  JSON.stringify(pageIndex, null, 2)
);
console.log(`Wrote page-index.json with ${pageIndex.length} entries`);

console.log('\nImport complete!');
console.log(`- Navigation: ${navigation.length} sections`);
console.log(`- Pages: ${pageCount} total`);
console.log(`- Chunks: ${chunks.length} files`);
