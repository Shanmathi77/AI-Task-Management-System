export default function DashboardCard({ title, value, icon }) {
  return (
    <div className="glass-card p-4 rounded-xl flex items-center gap-4">
      <div className="text-3xl">{icon}</div>

      <div>
        <p className="text-sm opacity-70">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
