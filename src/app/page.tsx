import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Pravo mesto da podeliš{' '}
            <span className="text-blue-500">svoju startup ideju!</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Poveži se sa preduzetnicima i podeli svoje ideje.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/ideas" className="btn-primary">
              Pogledaj ideje
            </Link>
            <Link href="/login" className="btn-secondary">
              Pridruži se
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white/70">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Zašto odabrati našu platformu?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Podeli ideje</h3>
              <p className="text-gray-600">
                Podeli svoje startup ideje sa zajednicom.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-600 text-xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Poveži se</h3>
              <p className="text-gray-600">
                Upoznaj se sa drugim preduzetnicima.
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Razvij se</h3>
              <p className="text-gray-600">
                Uči od drugih i razvijaj svoje veštine.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">500+</div>
              <div className="text-gray-600">Korisnika</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">150+</div>
              <div className="text-gray-600">Ideja</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">50+</div>
              <div className="text-gray-600">Projekata</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">24/7</div>
              <div className="text-gray-600">Podrška</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}