import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link
            href="https://shamscorner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            shamscorner.com
          </Link>
        </div>
      </div>
    </footer>
  );
}
