export default function Page() {
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-soft p-4">Stat Card</div>
        <div className="rounded-2xl bg-white shadow-soft p-4">Recent Activity</div>
        <div className="rounded-2xl bg-white shadow-soft p-4">Quick Actions</div>
      </div>
    </main>
  )
}
