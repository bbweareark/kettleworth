import Link from "next/link";
import { Logo } from "@kettleworth/ui";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <Link href="/" className="mb-8 inline-flex" aria-label="Kettleworth home"><Logo /></Link>
        {children}
      </div>
    </main>
  );
}
