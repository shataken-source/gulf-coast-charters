// Cron job management panel - simplified for package
'use client'

export default function CronAdminPanel() {
  const jobs = [
    { name: 'weather-alerts', schedule: '0 * * * *', status: 'active' },
    { name: 'daily-digest', schedule: '0 8 * * *', status: 'active' }
  ]
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">⏰ Cron Jobs</h1>
      
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4">Job Name</th>
              <th className="text-left p-4">Schedule</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.name} className="border-b">
                <td className="p-4">{job.name}</td>
                <td className="p-4">{job.schedule}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {job.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-blue-600 hover:underline">Run Now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
