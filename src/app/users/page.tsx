'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersAPI, UserPublic } from '../../lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersAPI.getAllUsers();
        setUsers(data);
      } catch (error: any) {
        setError(error.message || 'Greška pri učitavanju korisnika');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">Učitavanje korisnika...</div>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Naša zajednica</h1>
            <p className="text-gray-600">
              Upoznajte zajednicu preduzetnika i startup entuzijasta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user.username} className="card text-center">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-xl">👤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{user.username}</h3>
                <p className="text-gray-600 mb-2">{user.email}</p>
                {user.title && (
                  <p className="text-sm text-gray-500 mb-2">{user.title}</p>
                )}
                {user.location && (
                  <p className="text-sm text-gray-500 mb-2">📍 {user.location}</p>
                )}
                {user.skills && user.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap justify-center gap-1">
                      {user.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          +{user.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-center">
                <Link href={`/users/${encodeURIComponent(user.username)}`} className="btn-secondary">
  Profil
</Link>

                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-500 text-xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Nema korisnika
              </h3>
              <p className="text-gray-600">
                Još uvek nema registrovanih korisnika.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
