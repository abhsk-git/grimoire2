"use client";

import { Icon } from "./icons";
import Link from "next/link";

export function HowItWorks() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">
            <Icon name="feather" size={11} /> How it works
          </span>
          <h2>
            Three moves. <span className="serif">No friction.</span>
          </h2>
          <p>Write, collect, publish. Grimoire stays out of the way.</p>
        </div>

        <div className="steps">
          <div className="step">
            <div className="num">01 · WRITE</div>
            <h3>Open a page, start typing.</h3>
            <p>
              Markdown shortcuts, slash commands, focus mode. Drafts
              autosave by the keystroke.
            </p>
            <div className="step-visual">
              <div className="editor-mock">
                <div className="h">A small theory of bookmarks</div>
                <div style={{ color: "var(--fg-soft)", fontSize: 10, marginBottom: 6 }}>
                  draft · autosaved
                </div>
                <div>
                  A bookmark is a{" "}
                  <span style={{ color: "var(--fg)" }}>promise</span> to your future
                </div>
                <div>
                  self — to come back, to think again
                  <span className="cursor"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="num">02 · SAVE</div>
            <h3>Keep the links that feed your writing.</h3>
            <p>
              Save any URL, pull quotes mid-essay, keep the source
              attached. References don't disappear.
            </p>
            <div className="step-visual">
              <div className="urlbar">
                <span className="pulse"></span>
                <span style={{ color: "var(--fg)" }}>paulgraham.com/essay</span>
              </div>
              <div className="preview-card">
                <div className="img"></div>
                <div className="lines">
                  <div className="l1"></div>
                  <div className="l2"></div>
                  <div className="l3"></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Insert quote
                </span>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  Save reference
                </span>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="num">03 · PUBLISH</div>
            <h3>Ship to your own page.</h3>
            <p>
              A clean reading page at your handle. RSS free. No algorithm
              between you and your readers.
            </p>
            <div className="step-visual">
              <div className="urlbar" style={{ borderColor: "var(--accent)" }}>
                <Icon name="globe" size={11} />
                <span style={{ color: "var(--fg)" }}>grimoire.sysnode.in/you</span>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: "auto", flexWrap: "wrap" }}>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  <Icon name="rss" size={9} /> RSS
                </span>
                <span className="chip" style={{ fontSize: 10, padding: "3px 8px" }}>
                  .md export
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">
            <Icon name="feather" size={11} /> What it does well
          </span>
          <h2>
            Built for the <span className="serif">long thinker.</span>
          </h2>
        </div>

        <div className="features">
          <div className="feat wide">
            <div className="ico">
              <Icon name="feather" size={18} />
            </div>
            <h3>A real writing tool, not a textarea</h3>
            <p>
              Markdown, slash commands, inline link previews, and a focus
              mode that hides everything else. Drafts autosave. Publish to
              a clean reader page at your handle.
            </p>
          </div>

          <div className="feat half">
            <div className="ico">
              <Icon name="bookmark" size={18} />
            </div>
            <h3>References that outlive the link</h3>
            <p>
              Quote a source mid-essay. Keep a reader copy so it survives
              link rot. Your archive persists past the original page.
            </p>
          </div>

          <div className="feat half">
            <div className="ico">
              <Icon name="search" size={18} />
            </div>
            <h3>Search everything, always</h3>
            <p>
              Drafts, posts, saved links — one ⌘K. Everything you wrote
              and read, findable in a keystroke.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CTAStrip({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <section className="container">
      <div className="cta">
        <div>
          <h2>
            Start writing your <span className="serif">Grimoire.</span>
          </h2>
          <p>
            Free for personal use. No credit card. Your first post can be
            a single sentence — most are.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onSignIn}>
          Open the editor <Icon name="arrow-right" size={15} />
        </button>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-simple">
        <Link href="/" className="site-footer-brand">grimoire</Link>
        <span className="site-footer-year">© 2026</span>
      </div>
    </footer>
  );
}

export function Footer() {
  return <SiteFooter />;
}

// ── Compact footer for inner pages (explore, blog, user) ─────────────────────
export function PublicFooter(_props: {
  links?: { label: string; href: string }[];
}) {
  return <SiteFooter />;
}
