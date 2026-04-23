import { useEffect, useMemo, useState } from 'react';
import type { Critter, CrittersData, Category } from './types';
import { isActiveNow } from './timeWindow';
import './App.css';

const CATEGORY_LABEL: Record<Category, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  sea: 'Sea Creatures',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function CritterCard({ critter }: { critter: Critter }) {
  const hasPrice = critter.price != null;
  return (
    <div className="card">
      <div className="card-top">
        {critter.icon ? (
          <img src={critter.icon} alt={critter.name} className="card-icon" />
        ) : (
          <div className="card-icon placeholder" />
        )}
        <div className="card-name">{critter.name}</div>
      </div>
      <div className="card-strip">
        {hasPrice ? (
          <>
            <div className="strip-cell primary">{critter.price!.toLocaleString()} 🔔</div>
            <div className="strip-cell secondary">{critter.time}</div>
          </>
        ) : (
          <div className="strip-cell only">{critter.time}</div>
        )}
      </div>
      {(critter.location || critter.shadow) && (
        <div className="card-footer">
          {critter.location && <span>{critter.location}</span>}
          {critter.shadow && <span>· {critter.shadow}</span>}
        </div>
      )}
    </div>
  );
}

function Section({ category, critters }: { category: Category; critters: Critter[] }) {
  return (
    <section className={`section ${category}`}>
      <h2>
        {CATEGORY_LABEL[category]} <span className="count">{critters.length}</span>
      </h2>
      {critters.length === 0 ? (
        <p className="empty">Nothing catchable right now.</p>
      ) : (
        <div className="grid">
          {critters.map((c) => (
            <CritterCard key={c.slug} critter={c} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [data, setData] = useState<CrittersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  useEffect(() => {
    fetch('/critters.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const monthIdx = now.getMonth();
  const hour = now.getHours();

  const filtered = useMemo(() => {
    if (!data) return null;
    const out = {} as Record<Category, Critter[]>;
    (Object.keys(data) as Category[]).forEach((cat) => {
      out[cat] = data[cat]
        .filter((c) => c.months.north[monthIdx] && isActiveNow(c.time, now))
        .sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    });
    return out;
  }, [data, monthIdx, hour]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      <header className="header">
        <h1>Catchable right now</h1>
        <p className="subtitle">
          Northern hemisphere · {MONTH_NAMES[monthIdx]} · {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      </header>

      {error && <p className="error">Failed to load critters.json: {error}</p>}
      {!data && !error && <p className="loading">Loading…</p>}

      {filtered && (
        <>
          <Section category="fish" critters={filtered.fish} />
          <Section category="bugs" critters={filtered.bugs} />
          <Section category="sea" critters={filtered.sea} />
        </>
      )}
    </div>
  );
}
