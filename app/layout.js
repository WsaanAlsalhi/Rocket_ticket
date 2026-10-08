import './globals.css';

export const metadata = {
  title: 'Rocket Mission',
  description: 'NASA-inspired digital mission ticket system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
