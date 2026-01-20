import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">My AI Chat</h1>
      <nav className="flex gap-4">
        <Link
          to="/chat"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Chat
        </Link>
        <Link
          to="/demo"
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Demo
        </Link>
        <Link
          to="/future"
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Future
        </Link>
      </nav>
    </div>
  );
}
