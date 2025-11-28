// Tournament system component - simplified for package
'use client'
import { useState } from 'react'

export default function FishingTournamentSystem() {
  const [tournaments, setTournaments] = useState([])
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🏆 Fishing Tournaments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(tournament => (
          <div key={tournament.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold">{tournament.name}</h3>
            <p className="text-gray-600 mt-2">{tournament.description}</p>
            <div className="mt-4">
              <span className="text-lg font-semibold">${tournament.prize_pool} Prize Pool</span>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Enter Tournament
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
