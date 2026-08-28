import "./globals.css";
import { Navigation } from "../components/Navigation";
import { AuthProvider } from "../context/AdminAuthContext";

export const metadata = {
  title: "FreelanceFlow",
  description: "Full-stack freelance platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <main>
            <h1>FreelanceFlow</h1>
            <Navigation />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
