export const metadata = {
  title: "Lede — AI Media Intelligence by Camden Tribune",
  description: "Paste a YouTube or Vimeo URL. Get a transcript, article draft, key quotes, and subtitle files — automatically.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            /* Camden Tribune palette */
            --ct-blue:       #4a6d8c;
            --ct-blue-dark:  #2e4d6b;
            --ct-blue-light: #6a90b0;
            --ct-blue-mist:  rgba(74,109,140,0.08);
            --ct-red:        #b83232;
            --ct-red-light:  #d94444;
            --ct-red-dim:    #7a1e1e;

            /* Surfaces */
            --ink:           #0f0e0c;
            --charcoal:      #181614;
            --charcoal-mid:  #221f1c;
            --charcoal-light:#322e29;
            --rule:          #2e2b26;

            /* Text */
            --text:          #e8e2d8;
            --text-dim:      #a09488;
            --muted:         #6a6258;

            /* Status */
            --green:         #5aaa7a;
            --red-err:       #c85050;

            /* Fonts */
            --font-display: 'Playfair Display', Georgia, serif;
            --font-body:    'Source Serif 4', Georgia, serif;
            --font-mono:    'IBM Plex Mono', 'Courier New', monospace;
          }

          html { font-size: 16px; }

          body {
            font-family: var(--font-body);
            background: var(--ink);
            color: var(--text);
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            background-image:
              radial-gradient(ellipse 80% 40% at 50% -5%, rgba(74,109,140,0.10) 0%, transparent 65%);
          }

          a { color: var(--ct-blue-light); text-decoration: none; }
          a:hover { color: var(--ct-red-light); text-decoration: underline; }
          ::selection { background: var(--ct-blue); color: #fff; }

          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: var(--charcoal); }
          ::-webkit-scrollbar-thumb { background: var(--charcoal-light); border-radius: 3px; }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.35; }
          }
          .fade-up   { animation: fadeUp 0.5s ease both; }
          .fade-up-1 { animation-delay: 0.08s; }
          .fade-up-2 { animation-delay: 0.18s; }
          .fade-up-3 { animation-delay: 0.28s; }
          .pulsing   { animation: pulse 1.8s ease-in-out infinite; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
