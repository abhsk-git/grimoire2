/* How it works + Features + Discover + CTA + Footer */

const HowItWorks = () => (
  <section className="section" id="features">
    <div className="container">
      <div className="section-title">
        <span className="eyebrow"><Icon name="feather" size={11} /> The flow</span>
        <h2>Three motions. <span className="serif">Endless</span> use.</h2>
        <p>From the first paragraph to the moment a stranger reads your essay — Grimoire stays out of your way.</p>
      </div>

      <div className="steps">
        <div className="step">
          <div className="num">01 · WRITE</div>
          <h3>Open a page, start typing.</h3>
          <p>Markdown shortcuts, slash commands, focus mode. The chrome disappears so the words can show up.</p>
          <div className="step-visual">
            <div className="editor-mock">
              <div className="h">A small theory of bookmarks</div>
              <div style={{color:'var(--fg-soft)',fontSize:10,marginBottom:6}}>by maya · draft</div>
              <div>A bookmark is a <span style={{color:'var(--fg)'}}>promise</span> to your future</div>
              <div>self — to come back, to think again, to take</div>
              <div>seriously what passed for fleeting<span className="cursor"></span></div>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="num">02 · REFERENCE</div>
          <h3>Pull in the things you read.</h3>
          <p>Save the link, drop a quote into the post, keep the source attached. Your essays cite themselves.</p>
          <div className="step-visual">
            <div className="urlbar">
              <span className="pulse"></span>
              <span style={{color:'var(--fg)'}}>annie.substack.com</span>
            </div>
            <div className="preview-card">
              <div className="img"></div>
              <div className="lines"><div className="l1"></div><div className="l2"></div><div className="l3"></div></div>
            </div>
            <div style={{display:'flex',gap:6,marginTop:'auto'}}>
              <span className="chip" style={{fontSize:10,padding:'3px 8px'}}>Insert quote</span>
              <span className="chip" style={{fontSize:10,padding:'3px 8px'}}>Save reference</span>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="num">03 · PUBLISH</div>
          <h3>Ship to your own page.</h3>
          <p>A clean reader page at your-name.grimoire.so. Or your own domain. RSS for free, no algorithm in between.</p>
          <div className="step-visual">
            <div className="urlbar" style={{borderColor:'var(--accent)'}}>
              <Icon name="globe" size={11} />
              <span style={{color:'var(--fg)'}}>maya.grimoire.so/plaintext</span>
            </div>
            <div className="folders">
              <div className="folder"><span className="swatch" style={{background:'var(--accent)'}}></span>Published · 8</div>
              <div className="folder"><span className="swatch" style={{background:'var(--accent-2)'}}></span>Drafts · 4</div>
            </div>
            <div style={{display:'flex',gap:5,marginTop:'auto',flexWrap:'wrap'}}>
              <span className="chip" style={{fontSize:10,padding:'3px 8px'}}><Icon name="rss" size={9} /> RSS</span>
              <span className="chip" style={{fontSize:10,padding:'3px 8px'}}>.md export</span>
              <span className="chip" style={{fontSize:10,padding:'3px 8px'}}>Custom domain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="section" style={{paddingTop: 0}}>
    <div className="container">
      <div className="section-title">
        <span className="eyebrow"><Icon name="feather" size={11} /> Built for the long thinker</span>
        <h2>A writing tool that <span className="serif">remembers</span> what you've read.</h2>
        <p>Posts that cite themselves. References that outlive the link. An archive of your thinking, kept in plain text.</p>
      </div>

      <div className="features">
        <div className="feat wide">
          <div className="ico"><Icon name="feather" size={18} /></div>
          <h3>A real writing tool, not a textarea</h3>
          <p>Markdown, slash commands, inline link previews, and a focus mode that hides everything else. Drafts auto-save by the keystroke. Publish to a clean reader page at your-name.grimoire.so or your own domain.</p>
          <div className="feat-visual" style={{padding:14}}>
            <div className="editor-mock" style={{background:'var(--bg-elev)'}}>
              <div className="h">Notes on plaintext, again</div>
              <div style={{color:'var(--fg-soft)',fontSize:10,marginBottom:4}}>by maya · 4 min read · auto-saved 2s ago</div>
              <div>## Why I keep coming back</div>
              <div>Plaintext is the only format that outlives</div>
              <div>its app. Every other "permanent" is a slow</div>
              <div>trap that you don't notice until the trap<span className="cursor"></span></div>
            </div>
          </div>
        </div>

        <div className="feat col">
          <div className="ico"><Icon name="globe" size={18} /></div>
          <h3>A page of your own</h3>
          <p>Every published post lives at your handle. Clean typography, no ads, no algorithm.</p>
          <div className="feat-visual">
            <div className="urlbar" style={{borderColor:'var(--accent)',marginBottom:8}}>
              <Icon name="globe" size={11} />
              <span style={{color:'var(--fg)'}}>maya.grimoire.so</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:11}}>
              <div style={{padding:'6px 8px',borderRadius:6,background:'var(--bg-elev)',border:'1px solid var(--border)'}}>Notes on plaintext, again</div>
              <div style={{padding:'6px 8px',borderRadius:6,background:'var(--bg-elev)',border:'1px solid var(--border)',color:'var(--fg-muted)'}}>The shape of letters</div>
              <div style={{padding:'6px 8px',borderRadius:6,background:'var(--bg-elev)',border:'1px solid var(--border)',color:'var(--fg-muted)'}}>Field Notes #14</div>
            </div>
          </div>
        </div>

        <div className="feat third">
          <div className="ico"><Icon name="bookmark" size={18} /></div>
          <h3>References that outlive the link</h3>
          <p>Quote a source mid-essay, keep a clean reader copy so it survives link rot. Sidebar tucks them away.</p>
          <div className="feat-visual" style={{padding:12}}>
            <div style={{background:'var(--bg-elev)',border:'1px solid var(--border)',borderLeft:'3px solid var(--accent)',borderRadius:8,padding:'10px 12px',fontFamily:'var(--font-sans)',fontSize:12}}>
              <div style={{fontStyle:'italic',color:'var(--fg)'}}>"The point of reading is not to finish the book."</div>
              <div style={{display:'flex',alignItems:'center',gap:5,marginTop:6,fontSize:10,color:'var(--fg-soft)'}}>
                <span style={{width:12,height:12,borderRadius:3,background:'#ff6719',color:'white',fontSize:7,fontWeight:800,display:'grid',placeItems:'center'}}>SS</span>
                Annie Mueller
              </div>
            </div>
          </div>
        </div>

        <div className="feat third">
          <div className="ico"><Icon name="search" size={18} /></div>
          <h3>Search across everything you wrote and read</h3>
          <p>Your drafts, your published posts, your saved articles, your highlights — one keystroke.</p>
          <div className="feat-visual" style={{padding:10}}>
            <div className="search-mock">
              <div className="bar">
                <Icon name="search" size={12} />
                <span className="typed"><b>plaintext</b></span>
                <span className="kbd" style={{marginLeft:'auto'}}>⌘K</span>
              </div>
              <div className="results">
                <div className="r"><Icon name="feather" size={11} /><span><mark>Plaintext</mark>, again — your post</span><span className="k">draft</span></div>
                <div className="r"><Icon name="bookmark" size={11} /><span>The .md format will outlive…</span><span className="k">saved</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="feat third">
          <div className="ico"><Icon name="users" size={18} /></div>
          <h3>Public, private, or unlisted</h3>
          <p>Drafts are private until you publish. Each post is public, link-only, or kept entirely to yourself.</p>
          <div className="feat-visual">
            <div className="share-mock">
              <div className="row">
                <Icon name="globe" size={13} />
                <span className="who">Notes on plaintext, again</span>
                <span className="perm">Public</span>
              </div>
              <div className="row">
                <Icon name="link" size={13} />
                <span className="who">A small theory of bookmarks</span>
                <span className="perm">Unlisted</span>
              </div>
              <div className="row">
                <Icon name="lock" size={13} />
                <span className="who">Untitled draft</span>
                <span className="perm">Private</span>
              </div>
            </div>
          </div>
        </div>

        <div className="feat half">
          <div className="ico"><Icon name="rss" size={18} /></div>
          <h3>Open by default</h3>
          <p>RSS in, RSS out. Markdown export. Custom domain on Pro. An API and webhooks. Your writing should outlive any one app — ours included.</p>
          <div className="feat-visual" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,padding:24,flexWrap:'wrap'}}>
            <span className="chip" style={{padding:'8px 14px'}}><Icon name="rss" size={13} /> RSS feed</span>
            <span className="chip" style={{padding:'8px 14px'}}>.md export</span>
            <span className="chip" style={{padding:'8px 14px'}}><Icon name="globe" size={13} /> Custom domain</span>
            <span className="chip" style={{padding:'8px 14px'}}><Icon name="cmd" size={13} /> REST + Webhooks</span>
          </div>
        </div>

        <div className="feat half">
          <div className="ico"><Icon name="sparkles" size={18} /></div>
          <h3>Quietly intelligent</h3>
          <p>Optional AI: when you're writing, "find related from your archive" pulls three of your own saves that fit. Auto-tagging on saves. Always opt-in, never the loudest voice in the room.</p>
          <div className="feat-visual" style={{padding:14}}>
            <div className="search-mock">
              <div className="r" style={{background:'var(--accent-soft)',borderColor:'color-mix(in oklab, var(--accent) 30%, transparent)'}}>
                <Icon name="sparkles" size={12} />
                <span>3 of your saves match this paragraph</span>
                <span className="k">⌘ ↵</span>
              </div>
              <div className="r"><Icon name="bookmark" size={12} /><span>Annie Mueller — Reading like an artist</span><span className="k">essay</span></div>
              <div className="r"><Icon name="bookmark" size={12} /><span>Paul Graham — The age of the essay</span><span className="k">writing</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
);

const Discover = () => (
  <section className="section" id="discover" style={{paddingTop: 20}}>
    <div className="container">
      <div className="section-title">
        <span className="eyebrow"><Icon name="feather" size={11} /> The reading room</span>
        <h2>Read what the <span className="serif">curious</span> are writing.</h2>
        <p>Follow other people's grimoires. Subscribe to writers. Watch a thought become a public archive.</p>
      </div>

      <div className="discover-grid">
        {PUBLIC.map((p, i) => (
          <a href="#" key={i} className="public-card">
            <div className="cover" style={{background: p.cover}}>
              <h3>{p.title}</h3>
            </div>
            <div className="body">
              <p className="desc">{p.desc}</p>
              <div className="meta">
                <div className="au">
                  <div className="av">{p.initials}</div>
                  <span>{p.author}</span>
                </div>
                <span>·</span>
                <span>{p.items} posts</span>
                <span>·</span>
                <span>{p.followers} readers</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

const CTAStrip = () => (
  <section className="container">
    <div className="cta">
      <div>
        <h2>Start writing your <span className="serif">Grimoire</span>.</h2>
        <p>Free forever for personal use. No credit card. Your first post can be a single sentence — most are.</p>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="btn btn-primary btn-lg">
          Open the editor <Icon name="arrow-right" size={15} />
        </button>
        <button className="btn btn-ghost btn-lg">Import from Substack</button>
      </div>
    </div>
  </section>
);

const Footer = ({ theme, setTheme }) => (
  <footer className="footer">
    <div className="container">
      <div className="foot-grid">
        <div>
          <div className="brand" style={{marginBottom:8}}>
            <span className="brand-mark"><BrandMark size={26} /></span>
            <span>Grimoire</span>
          </div>
          <p className="foot-tagline">Save links. Write stories. Build the archive your future self will want to inherit.</p>
        </div>
        <div className="foot-col">
          <h4>Product</h4>
          <ul>
            <li><a>Features</a></li>
            <li><a>Web clipper</a></li>
            <li><a>iOS & Android</a></li>
            <li><a>Pricing</a></li>
            <li><a>Changelog</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Community</h4>
          <ul>
            <li><a>Discover</a></li>
            <li><a>Public grimoires</a></li>
            <li><a>The Stacks (blog)</a></li>
            <li><a>Discord</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>Company</h4>
          <ul>
            <li><a>About</a></li>
            <li><a>Manifesto</a></li>
            <li><a>Privacy</a></li>
            <li><a>Open API</a></li>
            <li><a>Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="foot-bottom">
        <span>© 2026 Grimoire — made for readers who keep notes.</span>
        <div className="theme-row" aria-label="Theme">
          {[
            { id:'light',    bg:'linear-gradient(135deg,#f6f6f1 50%,#2f7d4d 50%)' },
            { id:'dark',     bg:'linear-gradient(135deg,#0c0f14 50%,#3ee07a 50%)' },
            { id:'geek',     bg:'linear-gradient(135deg,#f3f4ed 50%,#2da14e 50%)' },
            { id:'midnight', bg:'linear-gradient(135deg,#061114 50%,#36e0c4 50%)' },
          ].map(p => (
            <button key={p.id}
              className={'theme-pip' + (theme === p.id ? ' active' : '')}
              style={{background: p.bg}}
              onClick={() => setTheme(p.id)}
              aria-label={p.id}
              title={p.id}
            />
          ))}
        </div>
      </div>
    </div>
  </footer>
);

Object.assign(window, { HowItWorks, Features, Discover, CTAStrip, Footer });
