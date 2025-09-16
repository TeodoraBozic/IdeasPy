'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, tokenUtils } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '', // ovo ostaje username jer backend tako traži
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validacija forme
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) {
      newErrors.username = 'Obavezan unos email-a';
    } else if (!/\S+@\S+\.\S+/.test(formData.username)) {
      newErrors.username = 'Email nije u ispravnom formatu';
    }

    if (!formData.password) {
      newErrors.password = 'Lozinka je obavezna';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Lozinka mora imati minimalno 6 karaktera';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authAPI.login(formData);

      if (response.access_token) {
        tokenUtils.setToken(response.access_token);
        router.push('/');
      } else {
        setErrorMessage('Greška pri prijavi - token nije primljen');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Greška pri prijavi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dobrodošli nazad!
          </h1>
          <p className="text-gray-600">
            Prijavite se da nastavite sa svojim startup idejama
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (mapira se na username u kodu) */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              📧 Email adresa
            </label>
            <input
              type="email"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input ${errors.username ? 'border-red-500' : ''}`}
              placeholder="Unesite email"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              🔒 Lozinka
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Vaša lozinka"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary disabled:bg-gray-400"
          >
            {isLoading ? 'Prijavljivanje...' : 'Prijavite se'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Nemate nalog?{' '}
            <a
              href="/register"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Registrujte se ovde
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
