# Diff Viewer - Enhanced Features

## Overview
This diff viewer application now includes all requested enhancements for comparing text files with an intuitive user interface.

## Features Implemented

### 1. File Upload Support ✅
- **Upload your own files** for dynamic comparison
- Supports multiple file types: `.txt`, `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.md`, `.css`, `.html`, `.xml`, `.yaml`, `.yml`
- Click the "Upload Files" button to access the upload interface
- Select two files to compare them side-by-side or inline

### 2. Collapsible Unchanged Sections ✅
- **Collapse unchanged lines** to focus on actual changes
- Click the "Collapse Unchanged" button to hide unchanged sections
- Unchanged sections with more than 3 consecutive lines are automatically collapsed
- Click on collapsed sections to expand and view the content
- Shows line range for collapsed sections (e.g., "lines 10-50")

### 3. Search and Navigation ✅
- **Search bar** to find specific text across both files
- Real-time search with highlighted results
- Navigation controls to jump between search results
- Shows current result position (e.g., "1 of 5")
- Press Previous/Next buttons to navigate through matches
- Current search result is highlighted with yellow background
- All matches are indicated with a subtle highlight

### 4. Export Functionality ✅
- **Export to HTML**: Download a standalone HTML report with all diff information
  - Includes stats, styling, and formatted diff content
  - Can be opened in any browser
  - Timestamped for tracking

- **Export to PDF**: Print or save as PDF using the browser's print function
  - Click "Print/PDF" button
  - Use browser's print dialog to save as PDF

## User Interface Features

### View Modes
- **Side-by-Side View**: Compare files in two columns
- **Inline View**: See changes in a unified view with +/- indicators

### Visual Indicators
- **Green background**: Added lines/content
- **Red background**: Removed lines/content
- **Yellow background**: Modified lines with word-level changes
- **Word-level highlighting**: See exactly what changed within a line
- **Line numbers**: Easy reference for both old and new versions

### Statistics Dashboard
- Real-time stats showing:
  - Number of additions
  - Number of deletions
  - Number of modifications
  - Number of unchanged lines

## Usage Examples

### Uploading Custom Files
1. Click the "Upload Files" button
2. Select your original file
3. Select your modified file
4. Click "Compare Files"
5. View the diff with all features enabled

### Using Search
1. Type your search term in the search bar
2. See the number of matches (e.g., "1 of 5")
3. Use arrow buttons to navigate between results
4. Current result scrolls into view automatically

### Collapsing Unchanged Content
1. Toggle "Collapse Unchanged" button
2. Sections with 4+ unchanged lines collapse automatically
3. Click collapsed sections to expand them
4. Toggle again to show all content

### Exporting Results
1. **For HTML Export**: Click "Export HTML" button
   - File downloads automatically
   - Open in browser to view formatted report

2. **For PDF Export**: Click "Print/PDF" button
   - Browser print dialog opens
   - Select "Save as PDF" as printer
   - Choose location and save

## Technical Details

### Technologies Used
- **Next.js 15**: React framework for server and client components
- **TypeScript**: Type-safe development
- **Tailwind CSS 3**: Utility-first styling
- **diff library**: Advanced diff algorithm with word-level comparison

### Performance
- Client-side diff computation for instant results
- Efficient rendering with React virtualization techniques
- Smooth scrolling to search results
- Responsive design for all screen sizes

## File Structure
```
diff-viewer/
├── app/
│   ├── components/
│   │   ├── InlineView.tsx       # Inline diff view with all features
│   │   └── SideBySideView.tsx   # Side-by-side view with all features
│   ├── utils/
│   │   └── diffUtils.ts         # Diff computation logic
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page with all features
├── public/
│   ├── version1.txt             # Sample file 1
│   └── version2.txt             # Sample file 2
└── package.json
```

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## Getting Started
1. Start the development server: `yarn dev`
2. Open http://localhost:3000
3. Use default files or upload your own
4. Explore all the enhanced features!

## Future Enhancements (Optional)
- Syntax highlighting for code files
- Diff history/sessions
- GitHub/GitLab integration
- Multi-file comparison
- Merge conflict resolution
- Custom color themes
