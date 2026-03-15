export const metadata = {
  title: "Link to Transcript",
  description: "Self-hosted media-to-transcript pipeline",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "Inter, Arial, sans-serif",
        background: "#0b1020",
        color: "#e8eefc"
      }}>
        {children}
      </body>
    </html>
  );
}
