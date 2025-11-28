import Link from 'next/link'

export default function Layout({ children, session }) {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow p-4">
        <div className="max-w-7xl mx-auto flex justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Gulf Coast Charters
          </Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
