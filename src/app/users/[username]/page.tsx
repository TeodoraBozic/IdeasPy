'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersAPI } from '../../../lib/api';

interface UserInfo {
  username: string;
  email: string;
  title?: string;
  description?: string;
  location?: string;
  skills?: string[];
  ideas: { id: string; title: string }[];
  followers: string[];
  following: string[];
}


export default function UserInfoPage() {
  const params = useParams();
  const username = params.username as string;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState('');
  const [me, setMe] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // učitaj user info
        const data = await usersAPI.getUserInfo(username);
        setUserInfo(data);

        // učitaj pratioce i praćenja
        const [foll, follg] = await Promise.all([
          usersAPI.getFollowers(username),
          usersAPI.getFollowing(username),
        ]);
        setFollowers(foll);
        setFollowing(follg);

        // učitaj ulogovanog korisnika
        try {
          const meData = await usersAPI.getMe();
          setMe(meData);
        } catch {
          // ako nije prijavljen, preskoči
        }
      } catch (err: any) {
        setError(err.message || 'Greška pri učitavanju korisnika');
      } finally {
        setLoading(false);
      }
    };
    if (username) load();
  }, [username]);

  const isFollowing = useMemo(() => {
    if (!me) return false;
    return followers.includes(me.username);
  }, [followers, me]);

  const handleFollowToggle = async () => {
    if (!userInfo || !me) {
      alert('Moraš biti prijavljen/a da bi pratio/la korisnike.');
      return;
    }
    setBtnLoading(true);
    try {
      if (isFollowing) {
        // optimistički update
        setFollowers(followers.filter((u) => u !== me.username));
        await usersAPI.unfollowUser(userInfo.username);
      } else {
        setFollowers([...followers, me.username]);
        await usersAPI.followUser(userInfo.username);
      }
    } catch (err: any) {
      alert(err.message || 'Greška pri izvršavanju akcije');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">⏳ Učitavanje...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!userInfo) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{userInfo.username}</h1>
            <p className="text-gray-600">{userInfo.email}</p>
            {userInfo.title && <p className="text-gray-700 mt-2">{userInfo.title}</p>}
          </div>

          {/* Dugme Follow/Unfollow */}
          {me && me.username !== userInfo.username && (
            <button
              onClick={handleFollowToggle}
              disabled={btnLoading}
              className={`px-4 py-2 rounded-lg font-semibold text-white transition
                ${isFollowing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                ${btnLoading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {btnLoading ? '...' : isFollowing ? 'Otprati' : 'Zaprati'}
            </button>
          )}
        </div>

        {/* Ideje */}
        <div className="card-glass p-6 mt-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">💡 Ideje</h2>
          {userInfo.ideas.length === 0 ? (
            <p className="text-gray-500">Korisnik još nema ideja.</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {userInfo.ideas.map((idea) => (
                <li key={idea.id}>{idea.title}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Followers / Following */}
        <div className="grid grid-cols-2 gap-6">
          <div className="card-glass p-6">
            <h2 className="text-xl font-semibold mb-3">
              👥 Pratioci ({followers.length})
            </h2>
            {followers.length === 0 ? (
              <p className="text-gray-500">Nema pratilaca.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {followers.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-glass p-6">
            <h2 className="text-xl font-semibold mb-3">➡️ Prati ({following.length})</h2>
            {following.length === 0 ? (
              <p className="text-gray-500">Ne prati nikoga.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {following.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Link href="/users" className="btn-secondary">
            ⬅ Nazad na sve korisnike
          </Link>
        </div>
      </div>
    </div>
  );
}
