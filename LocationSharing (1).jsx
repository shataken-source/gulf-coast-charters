/**
 * LOCATION SHARING COMPONENT
 * Real-time GPS tracking with privacy controls
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LocationSharing({ userId }) {
  const [location, setLocation] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [privacy, setPrivacy] = useState('private');
  const [pinnedLocations, setPinnedLocations] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [watchId, setWatchId] = useState(null);

  // Start location tracking
  const startSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed
        };

        setLocation(loc);

        // Update in database
        await supabase
          .from('shared_locations')
          .upsert({
            user_id: userId,
            location: `POINT(${loc.longitude} ${loc.latitude})`,
            accuracy: loc.accuracy,
            altitude: loc.altitude,
            heading: loc.heading,
            speed: loc.speed,
            privacy_level: privacy,
            active: true,
            updated_at: new Date().toISOString()
          });
      },
      (error) => console.error('Location error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    setWatchId(id);
    setSharing(true);
  };

  // Stop sharing
  const stopSharing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setSharing(false);

    // Mark inactive in database
    supabase
      .from('shared_locations')
      .update({ active: false })
      .eq('user_id', userId);
  };

  // Pin current location
  const pinLocation = async (name, category) => {
    if (!location) return;

    await supabase
      .from('pinned_locations')
      .insert({
        user_id: userId,
        name: name,
        location: `POINT(${location.longitude} ${location.latitude})`,
        category: category,
        privacy_level: privacy
      });

    loadPinnedLocations();
  };

  // Load pinned locations
  const loadPinnedLocations = async () => {
    const { data } = await supabase
      .from('pinned_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setPinnedLocations(data || []);
  };

  // Load nearby users
  const loadNearbyUsers = async () => {
    if (!location) return;

    const { data } = await supabase.rpc('get_nearby_users', {
      user_lat: location.latitude,
      user_lon: location.longitude,
      radius_miles: 10
    });

    setNearbyUsers(data || []);
  };

  useEffect(() => {
    loadPinnedLocations();
  }, []);

  useEffect(() => {
    if (location && sharing) {
      loadNearbyUsers();
    }
  }, [location]);

  return (
    <div className="location-sharing">
      <div className="controls">
        <button onClick={sharing ? stopSharing : startSharing}>
          {sharing ? '🛑 Stop Sharing' : '📍 Start Sharing'}
        </button>

        <select value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>

      {location && (
        <div className="current-location">
          <h3>Current Location</h3>
          <p>Lat: {location.latitude.toFixed(6)}</p>
          <p>Lon: {location.longitude.toFixed(6)}</p>
          <p>Accuracy: ±{location.accuracy?.toFixed(0)}m</p>
          {location.speed && <p>Speed: {(location.speed * 1.944).toFixed(1)} knots</p>}

          <button onClick={() => pinLocation('Fishing Spot', 'fishing_spot')}>
            📍 Pin This Location
          </button>
        </div>
      )}

      <div className="pinned-locations">
        <h3>My Pinned Locations ({pinnedLocations.length})</h3>
        {pinnedLocations.map((pin) => (
          <div key={pin.id} className="pin-card">
            <h4>{pin.name}</h4>
            <p>{pin.category}</p>
            <p>{pin.privacy_level}</p>
          </div>
        ))}
      </div>

      {sharing && nearbyUsers.length > 0 && (
        <div className="nearby-users">
          <h3>Nearby Anglers ({nearbyUsers.length})</h3>
          {nearbyUsers.map((user) => (
            <div key={user.id} className="user-card">
              <p>{user.name}</p>
              <p>{user.distance_miles.toFixed(1)} miles away</p>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .location-sharing {
          padding: 20px;
        }
        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: #0066CC;
          color: white;
          cursor: pointer;
        }
        .current-location {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .pin-card, .user-card {
          background: white;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
