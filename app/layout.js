import "./globals.css";

export const metadata = {
    title: "Rocket Mission | R2S Oman",
    description:
        "Register for the Rocket Mission and generate your personalized mission ticket.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
