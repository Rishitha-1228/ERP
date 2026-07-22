import { useEffect, useState } from "react";
import { getDashboardSummary } from "../api/dashboard";
import { StatGrid } from "../components/StatCard";
import { DashboardCard } from "../types";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((data) => setCards(data.cards))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Overview</div>
          <div className="page-title">Welcome back, {user?.name.split(" ")[0]}</div>
        </div>
      </div>
      {loading ? <p>Loading summary...</p> : <StatGrid cards={cards} />}
    </div>
  );
}
