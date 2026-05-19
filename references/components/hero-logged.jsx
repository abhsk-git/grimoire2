/* Hero - logged in state: writing-led dashboard widget */
const HeroLoggedIn = () => {
  return (
    <section className="hero logged-in">
      <div className="container">
        <div className="hello-row">
          <div>
            <span className="eyebrow">
              <Icon name="feather" size={11} /> Good evening
            </span>
            <h1 style={{marginTop: 14}}>
              Welcome back, <span style={{color:'var(--accent)'}}>Maya<span style={{fontFamily:'var(--font-serif)',fontStyle:'italic'}}>.</span></span>
            </h1>
            <p className="meta" style={{marginTop: 6}}>
              You have <b style={{color:'var(--fg)'}}>2 drafts</b> waiting and <b style={{color:'var(--fg)'}}>+38 reads</b> on your latest post this week.
            </p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost btn-sm"><Icon name="globe" size={13} /> View public profile</button>
            <button className="btn btn-primary btn-sm"><Icon name="pen" size={13} /> New post</button>
          </div>
        </div>

        <div className="quick-grid">
          <QuickCard ico="pen"       title="Continue draft"     desc="A small theory of bookmarks · 740w" k="⌘ ⏎" />
          <QuickCard ico="feather"   title="Start a new post"   desc="Empty page, no distractions"        k="⌘ N" />
          <QuickCard ico="bookmark"  title="Save a reference"   desc="Paste a URL · for your next post"   k="⌘ S" />
          <QuickCard ico="search"    title="Search everything"  desc="Drafts, posts, saves & highlights"  k="⌘ K" />
        </div>

        <div className="logged-grid">
          <div>
            <div className="section-h">
              <h2>Your writing</h2>
              <a href="#">All posts →</a>
            </div>
            <div className="posts-card">
              <div className="posts-row">
                <span className="pill live">Live</span>
                <div className="text">
                  <div className="t">Notes on plaintext, again</div>
                  <div className="m">Published May 14 · 412 reads · 28 likes · 4 min</div>
                </div>
                <Icon name="chevron-right" size={15} />
              </div>
              <div className="posts-row">
                <span className="pill draft">Draft</span>
                <div className="text">
                  <div className="t">A small theory of bookmarks</div>
                  <div className="m">740 words · edited yesterday · 4 references attached</div>
                </div>
                <Icon name="chevron-right" size={15} />
              </div>
              <div className="posts-row">
                <span className="pill draft">Draft</span>
                <div className="text">
                  <div className="t">On reading widely</div>
                  <div className="m">Started this morning · 124 words</div>
                </div>
                <Icon name="chevron-right" size={15} />
              </div>
              <div className="posts-row">
                <span className="pill live">Live</span>
                <div className="text">
                  <div className="t">Why I keep a digital commonplace book</div>
                  <div className="m">Published 1 week ago · 1,247 reads · 84 likes · 5 min</div>
                </div>
                <Icon name="chevron-right" size={15} />
              </div>
              <button className="btn btn-ghost btn-sm" style={{marginTop: 14, width: '100%'}}>
                <Icon name="plus" size={13} /> Start a new post
              </button>
            </div>
          </div>

          <div>
            <div className="section-h">
              <h2>For your next essay</h2>
              <a href="#">All saves →</a>
            </div>
            <div className="posts-card">
              <div className="posts-row">
                <span className="col-tag" style={{background:'#ff6719',color:'white'}}>SS</span>
                <div className="text">
                  <div className="t" style={{fontSize: 13}}>Reading like an artist</div>
                  <div className="m">annie.substack.com · saved 2h ago</div>
                </div>
              </div>
              <div className="posts-row">
                <span className="col-tag" style={{background:'#171717',color:'white'}}>GH</span>
                <div className="text">
                  <div className="t" style={{fontSize: 13}}>obsidian-md / obsidian-publish</div>
                  <div className="m">github.com · saved yesterday</div>
                </div>
              </div>
              <div className="posts-row">
                <span className="col-tag" style={{background:'#f0652f',color:'white'}}>YC</span>
                <div className="text">
                  <div className="t" style={{fontSize: 13}}>The age of the essay</div>
                  <div className="m">paulgraham.com · saved 3 days ago</div>
                </div>
              </div>
            </div>

            <div className="section-h" style={{marginTop: 28}}>
              <h2>Writers you follow</h2>
              <a href="#">Discover →</a>
            </div>
            <div className="posts-card">
              <div className="posts-row">
                <div className="avatar" style={{width:24,height:24,fontSize:10,borderWidth:0,background:'linear-gradient(135deg,#5563d0,#8e8df0)'}}>IR</div>
                <div className="text">
                  <div className="t" style={{fontSize: 13}}>Iván Reyes — Specimen of the week: Bricolage</div>
                  <div className="m">Published 1 day ago</div>
                </div>
              </div>
              <div className="posts-row">
                <div className="avatar" style={{width:24,height:24,fontSize:10,borderWidth:0,background:'linear-gradient(135deg,#14613a,#6abf85)'}}>AR</div>
                <div className="text">
                  <div className="t" style={{fontSize: 13}}>Dr. Anand Rao — How I read a paper, slowly</div>
                  <div className="m">Published 3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const QuickCard = ({ ico, title, desc, k }) => (
  <div className="quick-card">
    <div className="ico"><Icon name={ico} size={16} /></div>
    <h3>{title}</h3>
    <p>{desc}</p>
    <div className="shortcut"><span className="kbd">{k}</span></div>
  </div>
);

window.HeroLoggedIn = HeroLoggedIn;
