import "./globals.css";

export const metadata = {
    title: "Rocket Mission",
    description:
        "Join the Rocket Mission and generate your mission ticket.",
};

export default function RootLayout({
    children,
}) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}