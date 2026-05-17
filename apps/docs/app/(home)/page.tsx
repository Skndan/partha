import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Partha documentation</h1>
      <p>
        Browse product docs at{' '}
        <Link href="/docs" className="font-medium underline">
          /docs
        </Link>
        .
      </p>
    </div>
  );
}
