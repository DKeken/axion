import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "better-auth-ui/css";
import { Navigation } from "@/components/navigation";
import { UserMenu } from "@/components/user-menu";
import { Providers } from "./providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axion Stack - Meta-Framework",
  description:
    "Visual design and automatic generation of microservice architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <Providers>
            <div className="min-h-screen bg-background text-foreground">
              <header className="border-b bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                      <h1 className="text-xl font-bold">Axion Stack</h1>
                      <div className="ml-8">
                        <Navigation />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <UserMenu />
                    </div>
                  </div>
                </div>
              </header>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </div>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
