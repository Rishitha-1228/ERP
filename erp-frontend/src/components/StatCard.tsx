import { DashboardCard } from "../types";

export function StatGrid({ cards }: { cards: DashboardCard[] }) {
  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-card__label">{c.label}</div>
          <div className="stat-card__value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  return <span className={`tag tag-${status.toLowerCase()}`}>{status}</span>;
}
