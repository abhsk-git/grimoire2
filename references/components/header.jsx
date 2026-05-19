/* Header / nav */
const Header = ({ loggedIn, onSignOut }) => {
  return (
    <header className="header">
      <div className="container header-inner">
        <a href="#" className="brand">
          <span className="brand-mark"><BrandMark size={28} /></span>
          <span>Grimoire</span>
        </a>

        <nav className="nav-links">
          <a href="#features">Writing</a>
          <a href="#discover">Read</a>
          <a href="#features">References</a>
          <a href="#pricing">Pricing</a>
          <a href="#changelog">Changelog</a>
        </nav>

        <div className="header-right">
          {loggedIn && (
            <div className="search-input">
              <Icon name="search" size={14} />
              <input placeholder="Search your grimoire…" defaultValue="" />
              <span className="kbd">⌘K</span>
            </div>
          )}
          {!loggedIn && (
            <>
              <button className="icon-btn" aria-label="Theme"><Icon name="sun" size={16} /></button>
              <button className="btn btn-ghost btn-sm">Sign in</button>
              <button className="btn btn-primary btn-sm">
                Get started
                <Icon name="arrow-right" size={14} />
              </button>
            </>
          )}
          {loggedIn && (
            <>
              <button className="icon-btn" aria-label="Inbox"><Icon name="inbox" size={16} /></button>
              <button className="btn btn-primary btn-sm">
                <Icon name="pen" size={14} /> New post
              </button>
              <button className="avatar" onClick={onSignOut} title="Sign out (demo)">MA</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

window.Header = Header;
