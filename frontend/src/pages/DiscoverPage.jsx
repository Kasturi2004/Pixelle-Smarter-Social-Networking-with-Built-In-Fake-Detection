import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api, { getImageUrl } from "../api/client";
import SuspiciousBadge from "../components/SuspiciousBadge";
import ReportAccountModal from "../components/ReportAccountModal";

function DiscoverPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [reportTarget, setReportTarget] = useState(null);

  async function loadUsers() {
    const { data } = await api.get("/users");
    setUsers(data.users);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleFollow(userId) {
    await api.post(`/follows/${userId}`);
    await loadUsers();
  }

  return (
    <Layout>
      <section className="space-y-4">
        <div className="glass-panel rounded-3xl p-6 shadow-card">
          <h1 className="text-3xl font-semibold">Discover creators</h1>
          <p className="mt-2 text-sm text-slate-600">
            Explore accounts, follow them, review the fake-profile badge, and start conversations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((person) => (
            <article key={person._id} className="glass-panel rounded-3xl p-5 shadow-card">
              <div className="flex items-center gap-3">
                <img
                  src={getImageUrl(person.profilePic)}
                  alt={person.username}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <Link to={`/profile/${person.username}`} className="text-lg font-semibold">
                    @{person.username}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {person.stats.followers} followers | {person.stats.posts} posts
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <SuspiciousBadge isFake={person.isFake} riskScore={person.riskScore} />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{person.bio || "No bio yet."}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => toggleFollow(person._id)}
                  className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white"
                >
                  {person.isFollowing ? "Unfollow" : "Follow"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/messages?user=${person._id}`)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-orange-100"
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => setReportTarget(person)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    person.hasReported
                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                      : "bg-white text-coral ring-1 ring-orange-100 hover:bg-sand"
                  }`}
                >
                  {person.hasReported ? "Update report" : "Report account"}
                </button>
              </div>
            </article>
          ))}
        </div>

        {reportTarget ? (
          <ReportAccountModal
            targetUser={reportTarget}
            onClose={() => setReportTarget(null)}
            onReported={() =>
              setUsers((currentUsers) =>
                currentUsers.map((person) =>
                  person._id === reportTarget._id
                    ? {
                        ...person,
                        hasReported: true
                      }
                    : person
                )
              )
            }
          />
        ) : null}
      </section>
    </Layout>
  );
}

export default DiscoverPage;
