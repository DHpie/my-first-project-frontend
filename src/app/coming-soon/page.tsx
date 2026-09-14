import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-foreground">Coming soon</h1>
      <p className="mt-4 text-muted-foreground">
        This page is under construction.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-primary hover:underline"
      >
        &larr; Back to home
      </Link>
    </main>
  );
}
