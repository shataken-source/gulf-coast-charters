// =====================================================
// LOCATION SHARING COMPONENT
// =====================================================
// Real-time GPS tracking with privacy modes
// Features: Live tracking, pin locations, share routes, privacy controls
// =====================================================

'use client'

import { useState, useEffect, useRef } from 'react'
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { MapPin, Navigation, Share2, Lock, Users, Eye, EyeOff } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type PrivacyMode = 'public' | 'friends' | 'captain_only' | 'private'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: Date
}

interface SavedPin {
  id: string
  name: string
  latitude: number
  longitude: number
  description?: string
  type: 'hotspot' | 'launch' | 'favorite'
}

export default function LocationSharing() {
  const supabase = useSupabaseClient()
  const user = useUser()

  // State
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('private')
  const [isSharing, setIsSharing] = useState(false)
  const [savedPins, setSavedPins] = useState<SavedPin[]>([])
  const [selectedPin, setSelectedPin] = useState<SavedPin | null>(null)
  const [route, setRoute] = useState<number[][]>([])
  const [showNewPinDialog, setShowNewPinDialog] = useState(false)
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Refs
  const watchIdRef = useRef<number | null>(null)
  const mapRef = useRef<any>(null)

  // =====================================================
  // GPS TRACKING
  // =====================================================

  useEffect(() => {
    if (isSharing && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          }
          
          setCurrentLocation(newLocation)
          
          // Add to route
          setRoute(prev => [...prev, [newLocation.longitude, newLocation.latitude]])
          
          // Broadcast location if not private
          if (privacyMode !== 'private') {
            broadcastLocation(newLocation)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000
        }
      )
    } else if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isSharing, privacyMode])

  // =====================================================
  // BROADCAST LOCATION
  // =====================================================

  async function broadcastLocation(location: Location) {
    if (!user) return

    try {
      await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          privacy_mode: privacyMode,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error broadcasting location:', error)
    }
  }

  // =====================================================
  // SAVE PIN
  // =====================================================

  async function savePin(name: string, type: string, description?: string) {
    if (!newPinLocation || !user) return

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          user_id: user.id,
          name: name,
          latitude: newPinLocation.lat,
          longitude: newPinLocation.lng,
          description: description,
          type: type
        })
        .select()
        .single()

      if (error) throw error

      setSavedPins(prev => [...prev, data])
      setShowNewPinDialog(false)
      setNewPinLocation(null)
    } catch (error) {
      console.error('Error saving pin:', error)
    }
  }

  // =====================================================
  // LOAD SAVED PINS
  // =====================================================

  useEffect(() => {
    if (!user) return

    async function loadPins() {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)

      if (!error && data) {
        setSavedPins(data)
      }
    }

    loadPins()
  }, [user])

  // =====================================================
  // SHARE LOCATION
  // =====================================================

  async function generateShareLink() {
    if (!currentLocation || !user) return

    const shareCode = Math.random().toString(36).substring(7)
    
    await supabase
      .from('location_shares')
      .insert({
        user_id: user.id,
        share_code: shareCode,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })

    const shareUrl = `${window.location.origin}/location/${shareCode}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  // =====================================================
  // PRIVACY MODE ICON
  // =====================================================

  function getPrivacyIcon() {
    switch (privacyMode) {
      case 'public': return <Eye className="w-4 h-4" />
      case 'friends': return <Users className="w-4 h-4" />
      case 'captain_only': return <Navigation className="w-4 h-4" />
      case 'private': return <Lock className="w-4 h-4" />
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="relative w-full h-screen">
      {/* Map */}
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: currentLocation?.longitude || -88.0,
          latitude: currentLocation?.latitude || 30.4,
          zoom: 10
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        onClick={(e) => {
          setNewPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })
          setShowNewPinDialog(true)
        }}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            longitude={currentLocation.longitude}
            latitude={currentLocation.latitude}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
              {currentLocation.accuracy < 50 && (
                <div className="absolute -inset-2 bg-blue-400 rounded-full opacity-20" />
              )}
            </div>
          </Marker>
        )}

        {/* Saved Pins */}
        {savedPins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={pin.longitude}
            latitude={pin.latitude}
            onClick={() => setSelectedPin(pin)}
          >
            <MapPin
              className={`w-8 h-8 cursor-pointer ${
                pin.type === 'hotspot' ? 'text-red-500' :
                pin.type === 'launch' ? 'text-green-500' :
                'text-yellow-500'
              }`}
            />
          </Marker>
        ))}

        {/* Selected Pin Popup */}
        {selectedPin && (
          <Popup
            longitude={selectedPin.longitude}
            latitude={selectedPin.latitude}
            onClose={() => setSelectedPin(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">{selectedPin.name}</h3>
              {selectedPin.description && (
                <p className="text-xs text-gray-600 mt-1">{selectedPin.description}</p>
              )}
              <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 rounded">
                {selectedPin.type}
              </span>
            </div>
          </Popup>
        )}

        {/* Route Line */}
        {route.length > 1 && (
          <Source
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route
              }
            }}
          >
            <Layer
              id="route"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 3,
                'line-opacity': 0.6
              }}
            />
          </Source>
        )}
      </Map>

      {/* Controls Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-4 w-80">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Location Sharing
        </h2>

        {/* Sharing Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Live Tracking</span>
          <button
            onClick={() => setIsSharing(!isSharing)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSharing ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSharing ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Privacy Mode */}
        <div>
          <label className="block text-sm font-medium mb-2">Privacy Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(['public', 'friends', 'captain_only', 'private'] as PrivacyMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setPrivacyMode(mode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  privacyMode === mode
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {mode === 'public' && <Eye className="w-4 h-4" />}
                {mode === 'friends' && <Users className="w-4 h-4" />}
                {mode === 'captain_only' && <Navigation className="w-4 h-4" />}
                {mode === 'private' && <Lock className="w-4 h-4" />}
                <span className="capitalize text-xs">
                  {mode.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Lat:</span>
              <span className="font-mono">{currentLocation.latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lng:</span>
              <span className="font-mono">{currentLocation.longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy:</span>
              <span className="font-mono">{currentLocation.accuracy.toFixed(0)}m</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={generateShareLink}
            disabled={!currentLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Location
          </button>

          <button
            onClick={() => setRoute([])}
            disabled={route.length === 0}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear Route
          </button>
        </div>

        {/* Saved Pins */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Saved Locations ({savedPins.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedPins.map((pin) => (
              <div
                key={pin.id}
                onClick={() => {
                  mapRef.current?.flyTo({
                    center: [pin.longitude, pin.latitude],
                    zoom: 14
                  })
                  setSelectedPin(pin)
                }}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  pin.type === 'hotspot' ? 'text-red-500' :
                  pin.type === 'launch' ? 'text-green-500' :
                  'text-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pin.name}</p>
                  {pin.description && (
                    <p className="text-xs text-gray-500 truncate">{pin.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Pin Dialog */}
      {showNewPinDialog && newPinLocation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Save Location</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                id="pin-name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., My Favorite Spot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                id="pin-type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hotspot">Fishing Hotspot</option>
                <option value="launch">Launch Ramp</option>
                <option value="favorite">Favorite Spot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                id="pin-description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about this location..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const name = (document.getElementById('pin-name') as HTMLInputElement).value
                  const type = (document.getElementById('pin-type') as HTMLSelectElement).value
                  const description = (document.getElementById('pin-description') as HTMLTextAreaElement).value
                  if (name) savePin(name, type, description)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowNewPinDialog(false)
                  setNewPinLocation(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
