// Admin panel component - simplified for package
'use client'

export default function AdminConfiguration() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">⚙️ Admin Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold mt-2">1,234</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600">Active Bookings</h3>
          <p className="text-3xl font-bold mt-2">56</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600">Revenue (MTD)</h3>
          <p className="text-3xl font-bold mt-2">$12,450</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600">Active Captains</h3>
          <p className="text-3xl font-bold mt-2">89</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        {/* Activity feed */}
      </div>
    </div>
  )
}
