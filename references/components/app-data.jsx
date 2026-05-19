/* Real-feeling dashboard data — mixed content types */

const DASH_LINKS = [
  {
    id: 1,
    type: 'doc',
    title: 'Top 500 Cybersecurity Interview Prep Q&A Guide.pdf',
    desc: 'Comprehensive prep questions covering OWASP, network security, cryptography fundamentals and incident response.',
    domain: 'drive.google.com', fav: 'D', favColor: '#1f6fd9',
    tags: ['cybersecurity', 'interviewQs'],
    public: true, starred: true,
    when: 'May 15', pages: 142, size: '8.2 MB',
  },
  {
    id: 2,
    type: 'article',
    title: 'A small theory of bookmarks — why we save what we save',
    desc: 'On the difference between hoarding and curating, and why future-you needs a reason to come back.',
    domain: 'annie.substack.com', fav: 'SS', favColor: '#ff6719',
    tags: ['essay', 'writing'],
    public: true, starred: false,
    when: 'May 14',
    cover: 'linear-gradient(135deg, #b46a2a, #f4b860 70%, #d97757)',
  },
  {
    id: 3,
    type: 'video',
    title: '4 ways Python has turned my Android phone into the ultimate homelab companion',
    desc: 'A walkthrough of Termux, Tasker bridges, and on-device automation.',
    domain: 'youtube.com', fav: 'YT', favColor: '#ff0000',
    tags: ['python', 'homelab'],
    public: true, starred: false,
    when: 'May 13', duration: '14:22',
    cover: 'linear-gradient(160deg,#2d5fb8 0%, #f9c623 55%, #1b3a8a 100%)',
  },
  {
    id: 4,
    type: 'code',
    title: 'tldraw — an infinite canvas SDK for the web',
    desc: 'The whiteboard library that ships shape tools, multiplayer, and an embeddable React component.',
    domain: 'github.com', fav: 'GH', favColor: '#171717',
    tags: ['design', 'tools'],
    public: false, starred: true,
    when: 'May 12',
    repo: 'tldraw/tldraw', stars: '38.2k', lang: 'TypeScript',
  },
  {
    id: 5,
    type: 'quote',
    title: 'On reading like an artist',
    desc: 'A working theory of attention — and why a slow reader is often the more useful one.',
    domain: 'annie.substack.com', fav: 'SS', favColor: '#ff6719',
    tags: ['essay'],
    public: true, starred: true,
    when: 'May 11',
    quote: '"The point of reading is not to finish the book. It is to be changed by it — even a little, even in places you can\'t name."',
    cover: 'linear-gradient(135deg, #5563d0, #8e8df0 70%, #b486f0)',
  },
  {
    id: 6,
    type: 'doc',
    title: 'SQL Notes by Apna College (1).pdf',
    desc: 'JOINs, window functions, indexes — annotated with my own examples.',
    domain: 'drive.google.com', fav: 'D', favColor: '#1f6fd9',
    tags: ['sql'],
    public: true, starred: false,
    when: 'May 10', pages: 48, size: '2.1 MB',
  },
  {
    id: 7,
    type: 'article',
    title: 'Crafting Interpreters — Pratt Parsing in 250 lines',
    desc: 'The cleanest explanation of operator-precedence parsing I have ever read.',
    domain: 'craftinginterpreters.com', fav: 'CI', favColor: '#2f6fd9',
    tags: ['langdev'],
    public: true, starred: true,
    when: 'May 9',
    cover: 'linear-gradient(135deg,#0f1b3d, #2f6fd9 60%, #4ba3ff)',
  },
  {
    id: 8,
    type: 'placeholder',
    title: 'Your Career in Web Development Starts Here — The Odin Project',
    desc: 'The fullstack curriculum that keeps coming up in every roadmap thread.',
    domain: 'theodinproject.com', fav: 'OP', favColor: '#c45e1a',
    tags: ['webdev'],
    public: true, starred: false,
    when: 'May 8',
  },
  {
    id: 9,
    type: 'doc',
    title: '01 Cybersecurity Mastery — Obsidian Publish',
    desc: 'Foundational notes, written as a permanent reference.',
    domain: 'publish.obsidian.md', fav: 'OB', favColor: '#7c3aed',
    tags: ['cybersecurity'],
    public: false, starred: false,
    when: 'May 7', pages: 64, size: '—',
  },
];

const DASH_NAV = [
  { id: 'posts',   label: 'My Posts',    ico: 'feather',  count: 12 },
  { id: 'editor',  label: 'New Post',    ico: 'pen' },
  { id: 'explore', label: 'Read',        ico: 'sparkles' },
  { id: 'all',     label: 'Saved',       ico: 'bookmark', count: 247 },
  { id: 'public',  label: 'Public',      ico: 'globe',    count: 84 },
  { id: 'private', label: 'Private',     ico: 'lock',     count: 163 },
  { id: 'starred', label: 'Starred',     ico: 'star',     count: 21 },
];

const DASH_COLLECTIONS = [
  { name: 'Reading list',  count: 64,  color: '#5b54d6', current: true },
  { name: 'Cybersecurity', count: 38,  color: '#2f7d4d' },
  { name: 'Web dev',       count: 27,  color: '#b46a2a' },
  { name: 'Python',        count: 18,  color: '#1f6fd9' },
  { name: 'Recipes',       count: 9,   color: '#d04f63' },
];

const DASH_TAGS = [
  { t: 'webdev',        n: 12 },
  { t: 'cybersecurity', n: 9 },
  { t: 'python',        n: 7 },
  { t: 'essay',         n: 6 },
  { t: 'sql',           n: 4 },
  { t: 'MernStack',     n: 3 },
  { t: 'interviewQs',   n: 3 },
  { t: 'langdev',       n: 2 },
];

const DASH_STATS = [
  { l: 'References',   n: '247', trend: '+14',  ico: 'bookmark', spark: [3,5,4,6,7,5,9] },
  { l: 'Public',       n: '84',  trend: '+6',   ico: 'globe',    spark: [2,2,3,3,4,5,6] },
  { l: 'This week',    n: '14',  trend: '+3 d', ico: 'zap',      spark: [0,2,1,3,2,4,2] },
  { l: 'Collections',  n: '12',  trend: 'new',  ico: 'folder',   spark: [1,1,1,2,2,2,3] },
];

const MY_POSTS = [
  { id: 1, state: 'live',  title: 'Kalavanti Durg — A climb through history and sky',  meta: '3 min read · 38 views · 3 likes',  when: 'May 18', glyph: 'K' },
  { id: 2, state: 'draft', title: 'A small theory of bookmarks',                        meta: '740 words · last edited yesterday', when: 'May 17', glyph: 'B' },
  { id: 3, state: 'sched', title: 'Notes on plaintext, again',                          meta: 'Scheduled for May 22 · 1,240 words', when: 'May 17', glyph: 'P' },
  { id: 4, state: 'live',  title: 'Why I keep a digital commonplace book',              meta: '5 min read · 412 views · 28 likes', when: 'May 09', glyph: 'C' },
  { id: 5, state: 'draft', title: 'Untitled',                                            meta: '0 words · just now',                when: 'May 18', glyph: '·' },
];

const TRENDING_PUBLIC = [
  { title: 'Field Notes from the Internet', author: 'Maya Chen', initials: 'MC', tag: 'curation', followers: '2.3k', covers: 'linear-gradient(135deg,#b46a2a,#f4b860 60%,#d97757)' },
  { title: 'Studies in Typography',         author: 'Iván Reyes', initials: 'IR', tag: 'design',   followers: '1.1k', covers: 'linear-gradient(135deg,#1b3a6b,#5563d0 60%,#8e8df0)' },
  { title: 'The Reading Lab',               author: 'Dr. A. Rao', initials: 'AR', tag: 'research', followers: '4.8k', covers: 'linear-gradient(135deg,#14613a,#2f7d4d 60%,#6abf85)' },
];

Object.assign(window, {
  DASH_LINKS, DASH_NAV, DASH_COLLECTIONS, DASH_TAGS, DASH_STATS,
  MY_POSTS, TRENDING_PUBLIC
});
