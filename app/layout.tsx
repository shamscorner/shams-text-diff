import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import GitHubLink from "@/components/GitHubLink";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShamsTextDiff - Compare Text with GitHub-like UI",
  description:
    "Compare two text inputs and visualize the differences in a GitHub-like interface.",
  keywords: [
    "text diff",
    "text comparison",
    "diff tool",
    "github diff",
    "code diff",
    "text difference",
  ],
  authors: [{ name: "shamscorner" }],
  openGraph: {
    title: "ShamsTextDiff - Text Comparison Tool",
    description:
      "Compare two text inputs and visualize the differences in a GitHub-like interface.",
    url: "https://text-diff.shamscorner.com",
    siteName: "ShamsTextDiff",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShamsTextDiff - Text Comparison Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShamsTextDiff - Text Comparison Tool",
    description:
      "Compare two text inputs and visualize the differences in a GitHub-like interface.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex-1">{children}</div>
          <Footer />
          <GitHubLink />
        </ThemeProvider>
      </body>
    </html>
  );
}
