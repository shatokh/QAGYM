export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="/" aria-label="QA Comics Gym home">
          <span className="brand-mark" aria-hidden="true">
            QA
          </span>
          <span>QA Comics Gym</span>
        </a>
        <span className="status">Frontend skeleton</span>
      </header>

      <main className="app-main">
        <p className="eyebrow">Training store foundation</p>
        <h1>The clean comics store starts here.</h1>
        <p className="intro">
          The frontend workspace is running. Product scenarios will be added
          through approved clean-feature tasks.
        </p>

        <dl className="foundation-status" aria-label="Frontend foundation status">
          <div>
            <dt>Runtime</dt>
            <dd>React + Vite</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>TypeScript</dd>
          </div>
          <div>
            <dt>Product behavior</dt>
            <dd>Not started</dd>
          </div>
        </dl>
      </main>

      <footer className="app-footer">
        <span>QA Comics Gym</span>
        <span>Clean Core first</span>
      </footer>
    </div>
  );
}
