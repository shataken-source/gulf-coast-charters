// Charter listing card component
export default function CharterCard({ charter }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4">
      <img src={charter.photos[0]} alt={charter.title} className="w-full h-48 object-cover rounded" />
      <h3 className="mt-3 text-xl font-semibold">{charter.title}</h3>
      <p className="text-gray-600 mt-1">{charter.location}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-2xl font-bold">${charter.base_price}</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Book Now
        </button>
      </div>
    </div>
  )
}
