import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// title of the website
export const metadata = {
  title: "Pocket Money",
  description: "A finance AI platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
          <body
            className={`${inter.className}`}
          >
            <Header />
          <main className="min-h-screen bg-white text-gray-900">
            {children}
          </main>
          <Toaster richColors />
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">© 2025 Pocket Money. All rights reserved.</div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
