/* Brand mark + sample data */

const BrandMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    {/* book base */}
    <path d="M4 6.5C4 5.67 4.67 5 5.5 5H15v22H5.5C4.67 27 4 26.33 4 25.5z"
      fill="currentColor" opacity="0.12"/>
    <path d="M28 6.5C28 5.67 27.33 5 26.5 5H17v22h9.5c.83 0 1.5-.67 1.5-1.5z"
      fill="currentColor" opacity="0.12"/>
    <path d="M4 6.5C4 5.67 4.67 5 5.5 5H15v22H5.5C4.67 27 4 26.33 4 25.5z"
      stroke="currentColor" strokeWidth="1.6"/>
    <path d="M28 6.5C28 5.67 27.33 5 26.5 5H17v22h9.5c.83 0 1.5-.67 1.5-1.5z"
      stroke="currentColor" strokeWidth="1.6"/>
    {/* bookmark ribbon */}
    <path d="M21 5v8l2.5-2 2.5 2V5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* spine */}
    <path d="M15 5v22M17 5v22" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

window.BrandMark = BrandMark;

/* Sample bookmark data with deterministic colors */
const SAMPLES = [
  { fav: 'AR', host: 'arxiv.org',          title: 'A Mathematical Theory of Communication',     color: '#b1331f', tags: ['research','ai'] },
  { fav: 'TC', host: 'craftinginterpreters.com', title: 'Crafting Interpreters — Pratt Parsing', color: '#2f6fd9', tags: ['langdev'] },
  { fav: 'WC', host: 'wikipedia.org',      title: 'The history of moveable type printing',      color: '#444',     tags: ['history'] },
  { fav: 'NY', host: 'nytimes.com',        title: 'How libraries are reinventing themselves',   color: '#000',     tags: ['culture'] },
  { fav: 'GH', host: 'github.com',         title: 'tldraw — infinite canvas SDK',               color: '#171717',  tags: ['design','tools'] },
  { fav: 'SS', host: 'substack.com',       title: 'Reading like an artist — Annie Mueller',      color: '#ff6719',  tags: ['essay'] },
  { fav: 'YC', host: 'paulgraham.com',     title: 'The age of the essay',                       color: '#f0652f',  tags: ['writing'] },
  { fav: 'FT', host: 'fonts.google.com',   title: 'Variable fonts in editorial design',         color: '#4285f4',  tags: ['type'] },
];

const COLLECTIONS = [
  { name: 'Reading list', count: 142, color: '#2f7d4d', active: true,  ico: 'bookmark' },
  { name: 'Inspiration',  count: 64,  color: '#b46a2a', active: false, ico: 'sparkles' },
  { name: 'Research',     count: 38,  color: '#5563d0', active: false, ico: 'feather' },
  { name: 'Recipes',      count: 21,  color: '#b1331f', active: false, ico: 'folder' },
  { name: 'Watch later',  count: 17,  color: '#1f6fd9', active: false, ico: 'folder' },
];

const TAGS = [
  { t: 'design',   c: '#b46a2a' },
  { t: 'ai',       c: '#2f7d4d' },
  { t: 'history',  c: '#5563d0' },
  { t: 'essay',    c: '#b1331f' },
  { t: 'tools',    c: '#1f6fd9' },
  { t: 'writing',  c: '#7c4dff' },
  { t: 'culture',  c: '#0f9d58' },
  { t: 'type',     c: '#d04f63' },
];

const PUBLIC = [
  { title: 'Field Notes from the Internet', author: 'Maya Chen', initials: 'MC',
    desc: 'Weekly essays on attention, software, and the craft of paying attention.',
    items: 42, followers: '2.3k',
    cover: 'linear-gradient(135deg, #b46a2a, #f4b860 60%, #d97757)' },
  { title: 'Studies in Typography', author: 'Iván Reyes', initials: 'IR',
    desc: 'Long-form posts about the shape of letters, and the people who shaped them.',
    items: 28, followers: '1.1k',
    cover: 'linear-gradient(135deg, #1b3a6b, #5563d0 60%, #8e8df0)' },
  { title: 'How to Read a Paper', author: 'Dr. Anand Rao', initials: 'AR',
    desc: 'Essays on academic reading, with annotated reading lists at the bottom of each one.',
    items: 31, followers: '4.8k',
    cover: 'linear-gradient(135deg, #14613a, #2f7d4d 60%, #6abf85)' },
];

const RECENT_SAVES = [
  { fav: 'AR', color: '#b1331f', title: 'A Mathematical Theory of Communication', domain: 'arxiv.org', tag: 'research', when: '2 min ago', starred: true },
  { fav: 'GH', color: '#171717', title: 'tldraw — infinite canvas SDK', domain: 'github.com', tag: 'tools', when: '34 min ago', starred: false },
  { fav: 'SS', color: '#ff6719', title: 'Reading like an artist', domain: 'annie.substack.com', tag: 'essay', when: '2 hrs ago', starred: true },
  { fav: 'NY', color: '#000',    title: 'How libraries are reinventing themselves', domain: 'nytimes.com', tag: 'culture', when: 'yesterday', starred: false },
  { fav: 'WK', color: '#444',    title: 'Moveable type printing — Wikipedia', domain: 'wikipedia.org', tag: 'history', when: '2 days ago', starred: false },
];

const POSTS = [
  { state: 'live',  title: 'Why I keep a digital commonplace book', meta: 'Published 3 days ago · 412 reads' },
  { state: 'draft', title: 'Notes on plaintext, again', meta: 'Edited yesterday · 740 words' },
  { state: 'draft', title: 'A small theory of bookmarks', meta: 'Started this morning' },
];

Object.assign(window, { SAMPLES, COLLECTIONS, TAGS, PUBLIC, RECENT_SAVES, POSTS });
