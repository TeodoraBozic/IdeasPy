'use client';

import { useEffect, useState } from 'react';
import { ideasAPI, usersAPI, UserUpdate, IdeaDB, IdeaUpdate } from '../../lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // globalni baner za poruke o greškama (ne prekida render)
  const [error, setError] = useState('');

  // --- profil edit ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserUpdate>({});

  // --- share idea ---
  const [isSharing, setIsSharing] = useState(false);
  const [ideaData, setIdeaData] = useState({
    title: '',
    description: '',
    market: '',
    target_audience: '',
  });

  const handleShareIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ideasAPI.createIdea(ideaData);
      setIdeas((prev) => [created, ...prev]);
      setIdeaData({ title: '', description: '', market: '', target_audience: '' });
      setIsSharing(false);
    } catch (err: any) {
      setError(err.message || 'Greška pri objavi ideje');
    }
  };

  // --- edit/delete idea ---
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editIdeaData, setEditIdeaData] = useState<IdeaUpdate>({
    title: '',
    description: '',
    market: '',
    target_audience: '',
  });
  const [ideaBusyId, setIdeaBusyId] = useState<string | null>(null);

  const [ideas, setIdeas] = useState<IdeaDB[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(true);

  // ucitavanje korisnika
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersAPI.getMe();
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'Greška pri učitavanju profila');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ucitavanje ideja korisnika
  useEffect(() => {
    const fetchIdeas = async () => {
      const userId = user?._id ?? user?.id;
      if (!userId) return;
      setIdeasLoading(true);
      try {
        const data = await ideasAPI.getUserIdeas(userId);
        setIdeas(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status ?? err?.code;
        const msg = (err?.message || '').toLowerCase();
        // 404 = nema ideja → nije fatalno, prikaži prazno
        if (status === 404 || msg.includes('nema ideja') || msg.includes('no ideas')) {
          setIdeas([]);
        } else {
          setError(err.message || 'Greška pri učitavanju ideja korisnika');
        }
      } finally {
        setIdeasLoading(false);
      }
    };
    fetchIdeas();
  }, [user?._id, user?.id]);

  const startEditing = () => {
    setFormData({
      title: user?.title,
      description: user?.description,
      location: user?.location,
      skills: user?.skills,
    });
    setIsEditing(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await usersAPI.updateUser(formData);
      setUser(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Greška pri ažuriranju profila');
    }
  };

  const beginEditIdea = (idea: IdeaDB) => {
    setEditingIdeaId(idea._id);
    setEditIdeaData({
      title: idea.title ?? '',
      description: idea.description ?? '',
      market: idea.market ?? '',
      target_audience: idea.target_audience ?? '',
    });
  };

  const cancelEditIdea = () => {
    setEditingIdeaId(null);
    setEditIdeaData({ title: '', description: '', market: '', target_audience: '' });
  };

  const handleUpdateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdeaId) return;
    setIdeaBusyId(editingIdeaId);
    try {
      const updated = await ideasAPI.updateIdea(editingIdeaId, editIdeaData);
      setIdeas((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      cancelEditIdea();
    } catch (err: any) {
      setError(err.message || 'Greška pri ažuriranju ideje');
    } finally {
      setIdeaBusyId(null);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    const yes = window.confirm('Da li sigurno želiš da obrišeš ovu ideju?');
    if (!yes) return;
    setIdeaBusyId(id);
    try {
      await ideasAPI.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i._id !== id));
      if (editingIdeaId === id) cancelEditIdea();
    } catch (err: any) {
      setError(err.message || 'Greška pri brisanju ideje');
    } finally {
      setIdeaBusyId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">⏳ Učitavanje...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="section-padding py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">Moj Profil</h1>

          {/* Globalni baner za greške (ne blokira render) */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3">
              {error}
            </div>
          )}

          {/* Profil */}
          <div className="card-glass p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              {/* Profil Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.username ?? 'Korisnik'}</h2>
                <p className="text-gray-600 mb-4">{user?.title || 'Startup entuzijasta'}</p>

                {isEditing ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium">Titula</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Opis</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Lokacija</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Veštine (zarezom)</label>
                      <input
                        type="text"
                        value={formData.skills?.join(', ') || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="input"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="btn-primary">
                        Sačuvaj
                      </button>
                      <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                        Otkaži
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Kontakt informacije</h3>
                        <p className="text-gray-600">{user?.email}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Lokacija</h3>
                        <p className="text-gray-600">{user?.location || 'Nepoznata lokacija'}</p>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">📝 Opis</h3>
                      <p className="text-gray-600">{user?.description || 'Korisnik još nije dodao opis.'}</p>
                    </div>
                    <div className="flex space-x-4">
                      <button onClick={startEditing} className="btn-primary">
                        Uredi profil
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Podeli ideju */}
          <div className="mt-12 card-glass p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💡 Podeli ideju</h2>
            {isSharing ? (
              <form onSubmit={handleShareIdea} className="space-y-4">
                <input
                  type="text"
                  value={ideaData.title}
                  onChange={(e) => setIdeaData({ ...ideaData, title: e.target.value })}
                  className="input"
                  placeholder="Naziv ideje"
                  required
                />
                <textarea
                  value={ideaData.description}
                  onChange={(e) => setIdeaData({ ...ideaData, description: e.target.value })}
                  className="input"
                  placeholder="Opis"
                  required
                />
                <input
                  type="text"
                  value={ideaData.market}
                  onChange={(e) => setIdeaData({ ...ideaData, market: e.target.value })}
                  className="input"
                  placeholder="Tržište"
                  required
                />
                <input
                  type="text"
                  value={ideaData.target_audience}
                  onChange={(e) => setIdeaData({ ...ideaData, target_audience: e.target.value })}
                  className="input"
                  placeholder="Ciljna publika"
                  required
                />
                <div className="flex gap-4">
                  <button type="submit" className="btn-primary">
                    Objavi ideju
                  </button>
                  <button type="button" onClick={() => setIsSharing(false)} className="btn-secondary">
                    Otkaži
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setIsSharing(true)} className="btn-secondary">
                Podeli ideju
              </button>
            )}
          </div>

          {/* Moje ideje */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🗂️ Moje ideje</h2>
            {ideasLoading ? (
              <div className="text-center py-6">Učitavanje ideja...</div>
            ) : ideas.length === 0 ? (
              <div className="text-gray-600">Još uvek nemaš nijednu ideju. Objavi prvu! ✨</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ideas.map((idea) => (
                  <div key={idea._id} className="card-glass p-6">
                    {editingIdeaId === idea._id ? (
                      <form onSubmit={handleUpdateIdea} className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">Uredi ideju</h3>
                        <input
                          type="text"
                          value={editIdeaData.title || ''}
                          onChange={(e) => setEditIdeaData({ ...editIdeaData, title: e.target.value })}
                          className="input"
                          required
                        />
                        <textarea
                          value={editIdeaData.description || ''}
                          onChange={(e) => setEditIdeaData({ ...editIdeaData, description: e.target.value })}
                          className="input"
                          required
                        />
                        <input
                          type="text"
                          value={editIdeaData.market || ''}
                          onChange={(e) => setEditIdeaData({ ...editIdeaData, market: e.target.value })}
                          className="input"
                          required
                        />
                        <input
                          type="text"
                          value={editIdeaData.target_audience || ''}
                          onChange={(e) => setEditIdeaData({ ...editIdeaData, target_audience: e.target.value })}
                          className="input"
                          required
                        />
                        <div className="flex gap-3 justify-end">
                          <button type="submit" disabled={ideaBusyId === idea._id} className="btn-primary">
                            Sačuvaj
                          </button>
                          <button type="button" onClick={cancelEditIdea} className="btn-secondary">
                            Otkaži
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{idea.title}</h3>
                        <p className="text-gray-700 mb-3 line-clamp-3">{idea.description}</p>
                        <div className="text-sm text-gray-500 mb-4">
                          <div>
                            Tržište: <span className="font-medium">{idea.market}</span>
                          </div>
                          <div>
                            Ciljna publika: <span className="font-medium">{idea.target_audience}</span>
                          </div>
                          <div>
                            Kreirano:{' '}
                            {idea?.created_at ? new Date(idea.created_at).toLocaleString('sr-RS') : '—'}
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => beginEditIdea(idea)}
                            disabled={ideaBusyId === idea._id}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            Uredi
                          </button>
                          <button
                            onClick={() => handleDeleteIdea(idea._id)}
                            disabled={ideaBusyId === idea._id}
                            className="btn-danger text-sm px-4 py-2"
                          >
                            Obriši
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Followers & Following */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="card-glass p-4 text-center">
              <h3 className="text-lg font-semibold">👥 Pratioci</h3>
              <p className="text-2xl font-bold">{user?.followers?.length || 0}</p>
            </div>
            <div className="card-glass p-4 text-center">
              <h3 className="text-lg font-semibold">➡️ Prati</h3>
              <p className="text-2xl font-bold">{user?.following?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
