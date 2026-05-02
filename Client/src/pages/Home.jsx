export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🚀 App is running!</h1>
        <p className="text-gray-400 text-lg">React + Tailwind · Express · PostgreSQL · Prisma</p>
        <div className="mt-6 flex gap-4 justify-center">
          <a
            href="http://localhost:5000/health"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            Check API Health
          </a>
          <a
            href="/login"
            className="px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg font-medium transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
