import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">GPU Marketplace</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Decentralized platform for renting GPU computing power
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
