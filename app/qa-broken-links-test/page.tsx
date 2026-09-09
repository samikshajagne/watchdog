// Temporary QA page — used to verify the broken-link crawler actually
// detects dead internal links. Safe to delete once testing is done;
// nothing else in the app links to or depends on this route.
export default function BrokenLinksQaPage() {
  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Broken link crawler test page</h1>
      <p>This page exists only to verify the monitoring engine&apos;s broken-link check.</p>
      <ul>
        <li><a href="/">A working link (home)</a></li>
        <li><a href="/qa-broken-links-test/this-page-does-not-exist-1">Intentionally dead link #1</a></li>
        <li><a href="/qa-broken-links-test/this-page-does-not-exist-2">Intentionally dead link #2</a></li>
        <li><a href="/qa-broken-links-test/this-page-does-not-exist-3">Intentionally dead link #3</a></li>
      </ul>
    </div>
  );
}
