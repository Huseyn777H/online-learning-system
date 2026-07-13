import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Online Learning System",
  description: "Learn, teach, and manage courses online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main className="mx-auto min-h-[calc(100vh-57px)] max-w-6xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
