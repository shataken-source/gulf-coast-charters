// Main navigation component
export default function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">🎣 Gulf Coast Charters</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="/charters" className="text-gray-700 hover:text-blue-600">Browse</a>
            <a href="/tournaments" className="text-gray-700 hover:text-blue-600">Tournaments</a>
            <a href="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</a>
          </div>
        </div>
      </div>
    </nav>
  )
}
