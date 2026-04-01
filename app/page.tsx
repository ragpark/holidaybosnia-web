import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Holiday Bosnia App Shell</h1>
      <p>Phase B scaffold complete for planner migration.</p>
      <ul>
        <li>
          <Link href="/planner">Planner UI</Link>
        </li>
      </ul>
    </main>
  );
}
