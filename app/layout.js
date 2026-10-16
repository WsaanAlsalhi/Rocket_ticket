import './globals.css';

export const metadata = {
  title: 'Rocket Mission',
  description: 'Get your personalized Rocket Mission ticket.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
