import { useEffect, useMemo, useState } from 'react';
import type { Critter, CrittersData, Category } from './types';
import { isActiveNow } from './timeWindow';
import './App.css';

const CATEGORY_LABEL: Record<Category, string> = {
  fish: 'Fish',
  bugs: 'Bugs',
  sea: 'Sea Creatures',
};

const FISH_GROUP_ORDER = ['River', 'Pond', 'Sea'];

function fishGroup(location: string | null): string {
  if (!location) return 'Other';
  if (location.startsWith('River')) return 'River';
  if (location.startsWith('Pond')) return 'Pond';
  if (location.startsWith('Sea') || location === 'Pier') return 'Sea';
  return 'Other';
}

const BUGS_GROUP_ORDER = ['Flying', 'Trees', 'Rocks', 'Other'];

function bugsGroup(location: string | null): string {
  if (!location) return 'Other';
  if (location.startsWith('Flying')) return 'Flying';
  if (location.includes('tree') || location.includes('Trees') || location.includes('leaf')) return 'Trees';
  if (location.includes('rocks')) return 'Rocks';
  return 'Other';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHADOW_SIZES: Record<string, { label: string; ratio: number }> = {
  'Narrow':         { label: 'N',   ratio: 0.30 },
  'Smallest':       { label: 'XS',  ratio: 0.35 },
  'Small':          { label: 'S',   ratio: 0.50 },
  'Medium':         { label: 'M',   ratio: 0.65 },
  'Large':          { label: 'L',   ratio: 0.78 },
  'Large (Fin)':    { label: 'L',   ratio: 0.78 },
  'X Large':        { label: 'XL',  ratio: 0.88 },
  'Largest':        { label: 'XXL', ratio: 1.00 },
  'Largest (Fin)':  { label: 'XXL', ratio: 1.00 },
};

const FISH_SILHOUETTE_PATH =
  'M 340 640 C 410 510, 432 250, 398 130 C 370 75, 310 75, 282 130 C 248 250, 270 510, 340 640 Z';

function ShadowIcon({ shadow }: { shadow: string }) {
  const def = SHADOW_SIZES[shadow];
  if (!def) return null;
  const scale = def.ratio;
  return (
    <svg
      className="shadow-icon"
      viewBox="270 75 162 565"
      preserveAspectRatio="xMidYMid meet"
      aria-label={shadow}
    >
      <g transform={`translate(351 357.5) scale(${scale}) translate(-351 -357.5)`}>
        <path d={FISH_SILHOUETTE_PATH} fill="#786951" />
      </g>
    </svg>
  );
}

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
      <div className="card-header">
        <div className="critter-frame">
          {critter.icon ? (
            <img src={critter.icon} alt={critter.name} className="card-icon" />
          ) : (
            <div className="card-icon placeholder" />
          )}
        </div>
        {critter.shadow && (
          <div className="size-frame">
            <ShadowIcon shadow={critter.shadow} />
          </div>
        )}
      </div>
      <div className="card-name">{critter.name}</div>
      {hasPrice && (
        <div className="card-strip">
          <div className="strip-cell only">
            <img src="/bell.png" alt="bells" className="bell-icon" />
            <span>{critter.price!.toLocaleString()}</span>
          </div>
        </div>
      )}
      {critter.location && (
        <div className="card-footer">
          <span className="footer-loc">{critter.location}</span>
        </div>
      )}
    </div>
  );
}

function Section({ category, critters }: { category: Category; critters: Critter[] }) {
  return (
    <section className={`section ${category}`}>
      <h2>
        {critters.length} {CATEGORY_LABEL[category]}
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

function GroupedSection({
  category,
  critters,
  groupFn,
  groupOrder,
}: {
  category: Category;
  critters: Critter[];
  groupFn: (loc: string | null) => string;
  groupOrder: string[];
}) {
  const groups = new Map<string, Critter[]>();
  for (const c of critters) {
    const g = groupFn(c.location);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(c);
  }
  const orderedGroups = [
    ...groupOrder.filter((l) => groups.has(l)),
    ...[...groups.keys()].filter((l) => !groupOrder.includes(l)),
  ];

  return (
    <section className={`section ${category}`}>
      <h2>
        {critters.length} {CATEGORY_LABEL[category]}
      </h2>
      {critters.length === 0 ? (
        <p className="empty">Nothing catchable right now.</p>
      ) : (
        orderedGroups.map((g) => (
          <div key={g} className="loc-group">
            <h3 className="loc-heading">{g}</h3>
            <div className="grid">
              {groups.get(g)!.map((c) => (
                <CritterCard key={c.slug} critter={c} />
              ))}
            </div>
          </div>
        ))
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
          <GroupedSection
            category="fish"
            critters={filtered.fish}
            groupFn={fishGroup}
            groupOrder={FISH_GROUP_ORDER}
          />
          <GroupedSection
            category="bugs"
            critters={filtered.bugs}
            groupFn={bugsGroup}
            groupOrder={BUGS_GROUP_ORDER}
          />
          <Section category="sea" critters={filtered.sea} />
        </>
      )}
    </div>
  );
}
