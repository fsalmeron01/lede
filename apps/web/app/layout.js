export const metadata = {
  title: "Link to Transcript — Camden Tribune Media Tools",
  description: "Self-hosted media-to-transcript pipeline. YouTube and Vimeo to MP3, TXT, DOCX, and AI article drafts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --ink: #0e0d0b;
            --paper: #f5f0e8;
            --amber: #c8821a;
            --amber-light: #f0a830;
            --amber-dim: #7a4e0f;
            --charcoal: #1c1a16;
            --charcoal-mid: #2a2720;
            --charcoal-light: #3d3a32;
            --rule: #38352e;
            --muted: #8a8070;
            --text: #e8e0d0;
            --text-dim: #a09890;
            --green: #6db888;
            --red: #d96060;
            --font-display: 'Playfair Display', Georgia, serif;
            --font-body: 'DM Sans', system-ui, sans-serif;
            --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
          }

          html { font-size: 16px; }

          body {
            font-family: var(--font-body);
            background: var(--ink);
            color: var(--text);
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            background-image:
              radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200,130,26,0.08) 0%, transparent 70%);
          }

          a { color: var(--amber-light); text-decoration: none; }
          a:hover { text-decoration: underline; }

          ::selection {
            background: var(--amber);
            color: var(--ink);
          }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--charcoal); }
          ::-webkit-scrollbar-thumb { background: var(--charcoal-light); border-radius: 3px; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
          .fade-up { animation: fadeUp 0.5s ease both; }
          .fade-up-1 { animation-delay: 0.1s; }
          .fade-up-2 { animation-delay: 0.2s; }
          .fade-up-3 { animation-delay: 0.3s; }
          .pulsing { animation: pulse 1.8s ease-in-out infinite; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
