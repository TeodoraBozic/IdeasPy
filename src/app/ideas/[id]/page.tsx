'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ideasAPI, IdeaDB, usersAPI } from '../../../lib/api';
import { evaluationsAPI, EvaluationDB } from '../../../lib/api';

export default function IdeaDetailsPage() {
  const { id } = useParams() as { id: string };

  // idea
  const [idea, setIdea] = useState<IdeaDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // auth/me
  const [meId, setMeId] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  // evaluation state
  const [score, setScore] = useState<number | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [disabled, setDisabled] = useState(false);

  // sve ocene i prosek
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState<number>(0);

  // izračunaj vlasništvo kao čist boolean
  const isOwner = !!(idea && meId && idea.created_by === meId);

  const [likesCount, setLikesCount] = useState<number>(0);

useEffect(() => {
  if (!idea) return;
  const fetchLikes = async () => {
    try {
      const res = await evaluationsAPI.getLikesCount(idea._id);
      setLikesCount(res.like_count);
    } catch (e: any) {
      console.error(e.message);
    }
  };
  fetchLikes();
}, [idea]);

  useEffect(() => {
    const run = async () => {
      try {
        const [ideaData, meData] = await Promise.all([
          ideasAPI.getIdea(id),
          usersAPI.getMe().catch(() => null), // ako nije ulogovan
        ]);
        setIdea(ideaData);

        if (meData) {
          const normalizedId = meData._id ?? meData._id ?? null;
          setMeId(normalizedId);
        }
      } catch (e: any) {
        setError(e.message || 'Greška pri učitavanju ideje');
      } finally {
        setLoading(false);
        setMeLoading(false);
      }
    };
    run();
  }, [id]);

  // učitaj sve ocene za ideju
  useEffect(() => {
    if (!idea) return;
    const fetchEvaluations = async () => {
      try {
        const res = await evaluationsAPI.getIdeaEvaluations(idea._id);
        setEvaluations(res);
        if (res.length > 0) {
          setAvgScore(res[0]['Ukupna ocena']);
        } else {
          setAvgScore(0);
        }
      } catch (e: any) {
        console.error(e.message);
      }
    };
    fetchEvaluations();
  }, [idea]);

  const requireLogin = () => {
    if (!meId) {
      setMessage('Moraš biti prijavljen da bi ocenio/komentarisao ideju.');
      return true;
    }
    return false;
  };

  const handleSubmitEvaluation = async () => {
    if (requireLogin() || !idea || submitting) return;
    if (isOwner) {
      setMessage('Ne možeš oceniti svoju ideju.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const res: EvaluationDB = await evaluationsAPI.evaluateIdea({
        idea_id: idea._id,
        user_id: meId!,
        score: score ?? undefined,
        liked,
        comment: comment.trim() || undefined,
      });

      setScore(res.score ?? null);
      setLiked(res.liked ?? false);
      setComment(res.comment ?? '');
      setMessage('Tvoja evaluacija je sačuvana ✅');
      setDisabled(true);

      // odmah osveži listu i prosek
      const refreshed = await evaluationsAPI.getIdeaEvaluations(idea._id);
      setEvaluations(refreshed);
      setAvgScore(refreshed.length > 0 ? refreshed[0]['Ukupna ocena'] : 0);
    } catch (e: any) {
      setMessage(e.message || 'Greška pri evaluaciji ideje');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Učitavanje…</div>;
  if (error || !idea) {
    return (
      <div className="p-10 text-center text-red-600">
        {error || 'Ideja nije pronađena.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto card space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 text-xl">💡</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{idea.title}</h1>
            <p className="text-sm text-gray-500">
              Autor: {idea.author_username ?? idea.created_by}
            </p>
          </div>
        </div>

        <p className="text-gray-700">{idea.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
        <div><span className="font-medium">Tržište:</span> {idea.market}</div>
        <div><span className="font-medium">Ciljna grupa:</span> {idea.target_audience}</div>

        <div className="sm:col-span-2 flex items-center">
            <span className="font-medium mr-2">Broj lajkova:</span>
            <span className="text-red-500 font-bold flex items-center text-lg">
             {likesCount} 
            </span>
        </div>

        <div className="sm:col-span-2">
            <span className="font-medium">Kreirano:</span>{' '}
            {new Date(idea.created_at).toLocaleDateString('sr-RS')}
        </div>
        </div>

        {/* Evaluation */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">Tvoja evaluacija</h2>

          {/* Ocena i like */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setScore(val)}
                disabled={disabled || isOwner}
                className={`px-3 py-1 rounded-full border text-sm
                  ${score === val ? 'bg-yellow-400 text-white' : 'bg-gray-100'}
                  ${disabled || isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {val} ⭐
              </button>
            ))}

            <button
              type="button"
              onClick={() => setLiked(!liked)}
              disabled={disabled || isOwner}
              className={`ml-4 px-3 py-1 rounded-full border text-sm
                ${liked ? 'bg-green-500 text-white' : 'bg-gray-100'}
                ${disabled || isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {liked ? '✔ Sviđa mi se' : 'Sviđa mi se'}
            </button>
          </div>

          {/* Komentar */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ostavi komentar…"
            className="w-full border rounded-lg p-3"
            rows={3}
            disabled={disabled || isOwner}
          />

          {/* Dugme za slanje */}
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={handleSubmitEvaluation}
              disabled={submitting || disabled || isOwner}
              className={`btn-primary ${submitting || disabled || isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Pošalji evaluaciju
            </button>
            {meLoading ? (
              <span className="text-xs text-gray-500">Provera prijave…</span>
            ) : !meId ? (
              <span className="text-xs text-gray-500">
                Prijavi se da bi ocenio/komentarisao.
              </span>
            ) : isOwner ? (
              <span className="text-xs text-gray-500">
                Ne možeš ocenjivati svoju ideju.
              </span>
            ) : null}
          </div>

          {message && (
            <p className="mt-3 text-sm text-gray-600">{message}</p>
          )}
        </div>

        {/* Lista svih ocena */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">Ocene korisnika</h2>
          <p className="mb-4">Prosečna ocena: ⭐ {avgScore}</p>

          {evaluations.length === 0 ? (
            <p className="text-gray-500">Još nema ocena za ovu ideju.</p>
          ) : (
            <ul className="space-y-2">
              {evaluations.map((ev, idx) => (
                <li key={idx} className="border rounded-lg p-3 bg-gray-50">
                  <p><strong>{ev.Korisnik}</strong> ocenio/la {ev.Ocena ?? '—'} ⭐</p>
                  {ev.Komentar && (
                    <p className="text-gray-600 mt-1">💬 {ev.Komentar}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between">
          <Link href="/ideas" className="btn-secondary">Nazad na ideje</Link>
        </div>
      </div>
    </div>
  );
}
