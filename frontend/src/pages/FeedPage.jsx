import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import CreatePostForm from "../components/CreatePostForm";
import PostCard from "../components/PostCard";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import SuspiciousBadge from "../components/SuspiciousBadge";

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasOwnPosts, setHasOwnPosts] = useState(false);
  const [profileSummary, setProfileSummary] = useState(null);
  const [showAccountStatus, setShowAccountStatus] = useState(false);

  const accountAgeDays = user?.createdAt
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      )
    : 0;

  const goodSignals = [
    user?.profilePic ? "You have a profile photo." : null,
    user?.fullName?.trim() ? "Your full name is filled in." : null,
    user?.bio?.trim()?.length >= 20 ? "Your bio gives people useful context." : null,
    hasOwnPosts ? "You have already posted content." : null,
    accountAgeDays >= 14 ? "Your account is not brand new." : null,
    user?.riskScore < 0.62 ? "Your current risk score is in a safer range." : null
  ].filter(Boolean);

  const needsAttention = [
    !user?.profilePic ? "Add a profile photo to make the account feel more authentic." : null,
    !user?.fullName?.trim() ? "Add your full name for a more complete identity." : null,
    !user?.bio?.trim()
      ? "Write a short bio so your profile looks more complete."
      : user?.bio?.trim()?.length < 20
        ? "Your bio is very short. Adding a little more detail can help."
        : null,
    !hasOwnPosts ? "Share your first post to improve account activity." : null,
    accountAgeDays > 0 && accountAgeDays < 14
      ? "Very new accounts can appear more suspicious until they build activity."
      : null,
    user?.riskScore >= 0.62
      ? "Your current pattern is being flagged as suspicious, so profile quality matters more."
      : null
  ].filter(Boolean);

  async function loadFeed() {
    try {
      setLoading(true);
      const [feedResponse, myPostsResponse, myProfileResponse] = await Promise.all([
        api.get("/posts/feed"),
        api.get(`/posts/user/${user._id}`),
        api.get("/users/me")
      ]);

      setPosts(feedResponse.data.posts);
      setHasOwnPosts(myPostsResponse.data.posts.length > 0);
      setProfileSummary(myProfileResponse.data.user);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?._id) {
      loadFeed();
    }
  }, [user?._id]);

  return (
    <Layout>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] 2xl:grid-cols-[minmax(0,1.28fr)_390px]">
        <section className="space-y-6">
          {loading ? (
            <div className="glass-panel rounded-3xl p-6 shadow-card">Preparing your feed...</div>
          ) : !hasOwnPosts ? (
            <CreatePostForm
              onPostCreated={(post) => {
                setPosts((current) => [post, ...current]);
                setHasOwnPosts(true);
              }}
            />
          ) : null}

          {loading ? (
            <div className="glass-panel rounded-3xl p-6 shadow-card">Loading feed...</div>
          ) : posts.length ? (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              Your feed is empty. Follow users in Discover to see more posts.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Account status</p>
            <h2 className="mt-2 text-2xl font-semibold">@{user?.username}</h2>
            <div className="mt-4">
              <SuspiciousBadge isFake={user?.isFake} riskScore={user?.riskScore} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This score is generated from posting volume, account age, follow ratio, and recent
              activity.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-blush/70 to-orange-50 p-6 text-ink shadow-card">
            <p className="text-sm uppercase tracking-[0.24em] text-coral/80">Pixelle Insight</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">Build trust with every post</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your profile activity, posting behavior, and account details help shape how authentic
              your account appears across Pixelle.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAccountStatus((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-[15px] font-semibold text-white shadow-md shadow-orange-200/70 transition hover:bg-orange-500"
              >
                Account status
                <span className="text-lg">{showAccountStatus ? "−" : "+"}</span>
              </button>
            </div>

            {showAccountStatus ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    What Looks Good
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {goodSignals.length ? (
                      goodSignals.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <span className="mt-1 text-emerald-600">•</span>
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <p>No strong positive signals yet. A fuller profile will help.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-orange-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
                    What Needs Attention
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {needsAttention.length ? (
                      needsAttention.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <span className="mt-1 text-coral">•</span>
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <p>Your account looks well-rounded right now.</p>
                    )}
                  </div>
                </div>

                {profileSummary?.stats ? (
                  <div className="rounded-[1.5rem] border border-orange-100/80 bg-white/70 p-4 text-sm text-slate-600">
                    Posts: <span className="font-semibold text-ink">{profileSummary.stats.posts}</span>
                    {" · "}
                    Followers:{" "}
                    <span className="font-semibold text-ink">{profileSummary.stats.followers}</span>
                    {" · "}
                    Following:{" "}
                    <span className="font-semibold text-ink">{profileSummary.stats.following}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default FeedPage;
