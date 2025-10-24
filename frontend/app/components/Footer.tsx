import Link from "next/link"
import { Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className=" border-border bg-background mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-lg font-bold text-foreground">DeepWork</div>

          {/* GitHub Link */}
          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
            <span className="text-sm">GitHub</span>
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DeepWork. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

