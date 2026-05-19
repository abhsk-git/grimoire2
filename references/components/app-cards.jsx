/* Mixed-type link card component */

const LinkCard = ({ link }) => {
  const hero = renderHero(link);
  return (
    <div className="lc">
      <span className={'visibility ' + (link.public ? 'pub' : 'prv')}>
        <Icon name={link.public ? 'globe' : 'lock'} size={9} />
        {link.public ? 'Public' : 'Private'}
      </span>
      {hero}
      <div className="lc-body">
        <div className="lc-source">
          <span className="fav" style={{background: link.favColor}}>{link.fav}</span>
          <span>{link.domain}</span>
        </div>
        <div className="lc-title">{link.title}</div>
        {link.desc && <div className="lc-desc">{link.desc}</div>}
        <div className="lc-tags">
          {link.tags.map(t => (
            <span key={t} className="lc-tag"><span className="h">#</span>{t}</span>
          ))}
        </div>
        <div className="lc-foot">
          <span>{link.when}</span>
          <span>·</span>
          <span>{link.public ? 'Public' : 'Private'}</span>
          <span className={'star' + (link.starred ? ' on' : '')}>
            <Icon name={link.starred ? 'star-fill' : 'star'} size={13} />
          </span>
        </div>
      </div>
    </div>
  );
};

function renderHero(l) {
  switch (l.type) {
    case 'doc':
      return (
        <div className="lc-hero doc">
          <div className="pages"></div>
          <div className="doc-meta">
            <span className="pg">{l.pages} pages</span>
            <span>{l.size}</span>
            <span>· PDF document</span>
          </div>
        </div>
      );
    case 'video':
      return (
        <div className="lc-hero video" style={{background: l.cover}}>
          <div className="play">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l10-5.5z"/>
            </svg>
          </div>
          <div className="duration">{l.duration}</div>
        </div>
      );
    case 'code':
      return (
        <div className="lc-hero code">
          <div><span className="ln">1</span>  <span className="cm">// {l.repo}</span></div>
          <div><span className="ln">2</span>  <span className="kw">import</span> {`{`} <span className="fn">Tldraw</span> {`}`} <span className="kw">from</span> <span className="st">'tldraw'</span></div>
          <div><span className="ln">3</span>  </div>
          <div><span className="ln">4</span>  <span className="kw">export default</span> <span className="kw">function</span> <span className="fn">App</span>() {`{`}</div>
          <div><span className="ln">5</span>    <span className="kw">return</span> &lt;<span className="fn">Tldraw</span> /&gt;</div>
          <div style={{marginTop:'auto', display:'flex', gap:14, color:'#6e7681', fontSize:10}}>
            <span>★ {l.stars}</span>
            <span>●</span>
            <span>{l.lang}</span>
          </div>
        </div>
      );
    case 'quote':
      return (
        <div className="lc-hero gradient" style={{background: l.cover}}>
          <div className="quote">{l.quote}</div>
        </div>
      );
    case 'article':
      return <div className="lc-hero img" style={{background: l.cover}}></div>;
    case 'placeholder':
    default:
      return (
        <div className="lc-hero placeholder">
          <div className="site">
            <span className="fav" style={{
              width:14,height:14,borderRadius:3,background:l.favColor,color:'white',
              display:'inline-grid',placeItems:'center',fontSize:8,fontWeight:800
            }}>{l.fav}</span>
            {l.domain}
          </div>
        </div>
      );
  }
}

/* List view row */
const ListRow = ({ link }) => (
  <div className="list-row">
    <div className="fav" style={{background: link.favColor}}>{link.fav}</div>
    <div>
      <div className="title">{link.title}</div>
      <div className="desc">{link.domain}{link.desc ? ' — ' + link.desc.slice(0, 80) + '…' : ''}</div>
    </div>
    <div className="tags">
      {link.tags.slice(0,3).map(t => <span key={t} className="lc-tag"><span className="h">#</span>{t}</span>)}
    </div>
    <span className="vis">
      <Icon name={link.public ? 'globe' : 'lock'} size={11} />
      {link.public ? 'Public' : 'Private'}
    </span>
    <span className="when">{link.when}</span>
    <span style={{color: link.starred ? 'var(--accent-2)' : 'var(--fg-soft)'}}>
      <Icon name={link.starred ? 'star-fill' : 'star'} size={14} />
    </span>
  </div>
);

Object.assign(window, { LinkCard, ListRow });
