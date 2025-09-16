'use client';

import { useState, useEffect } from 'react';
import { ideasAPI, IdeaDB } from '../../lib/api';
import Link from 'next/link';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const data = await ideasAPI.getAllIdeas();
        setIdeas(data);
      } catch (error: any) {
        setError(error.message || 'Greška pri učitavanju ideja');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">Učitavanje ideja...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Startup Ideje
            </h1>
            <p className="text-gray-600">
              Otkrijte najnovije startup ideje od naše zajednice
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <div key={idea._id} className="card">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 text-xl">💡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {idea.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                    Autor: {idea.author_username ?? idea.created_by}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {idea.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Tržište:</span> {idea.market}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Ciljna grupa:</span> {idea.target_audience}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Kreirano:</span> {new Date(idea.created_at).toLocaleDateString('sr-RS')}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">Startup</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">Ideja</span>
                  </div>
                  <Link href={`/ideas/${idea._id}`} className="btn-primary text-sm">
                    Detalji
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {ideas.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-500 text-xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Nema ideja</h3>
              <p className="text-gray-600">Još uvek nema podeljenih startup ideja.</p>
            </div>
          )}
          
          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="btn-secondary">
              Učitaj još ideja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}