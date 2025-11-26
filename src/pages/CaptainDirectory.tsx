import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Shield, Clock, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

export default function CaptainDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCaptains() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('captains').select('*');
        if (error) throw error;
        setCaptains(data || []);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCaptains();
  }, []);

  const filteredCaptains = captains.filter(captain =>
    captain.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    captain.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Find Your Captain</h1>
        <div className="max-w-2xl mx-auto mb-12">
          <Input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="py-6 text-lg" />
        </div>
        {filteredCaptains.length === 0 ? (
          <div className="text-center py-12"><p className="text-xl text-gray-600">No captains yet</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCaptains.map((captain) => (
              <Card key={captain.id} className="p-6">
                <h3 className="font-bold text-lg mb-2">{captain.name}</h3>
                <p className="text-gray-600">{captain.location}</p>
                <Link to={`/captain/${captain.id}`}><Button className="w-full mt-4">View Profile</Button></Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
