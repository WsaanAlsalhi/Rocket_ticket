export const metadata = {
    title: "Rocket Mission",
    description: "Join our Rocket Mission"
};

export default function RootLayout({ children }) {

    return (
        <html lang="en">

            <body>
                {children}
            </body>

        </html>
    );
}