import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
        <span className="text-xl font-semibold text-wavelength-red tracking-tight">
          Wavelength
        </span>
        <nav className="flex gap-6 text-sm text-gray-600">
          <Link href="/discover" className="hover:text-wavelength-red">
            Discover
          </Link>
          <Link href="/connections" className="hover:text-wavelength-red">
            Connections
          </Link>
          <Link href="/profile" className="hover:text-wavelength-red">
            Profile
          </Link>
        </nav>
      </header>
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Find your people nearby.
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-8">
          The right ones are already around you. See your match — only when it’s
          mutual.
        </p>
        <Link
          href="/profile"
          className="px-6 py-3 rounded-lg bg-wavelength-red text-white font-medium hover:opacity-90 transition"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
