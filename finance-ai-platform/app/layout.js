import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pocket Money",
  description: "A finance AI platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className}`}
      >
        <Header />
        <main className="min-h-screen bg-white text-gray-900">
          {children}
        </main>
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">© 2025 Pocket Money. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}
