import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api, { getImageUrl } from "../api/client";
import SuspiciousBadge from "../components/SuspiciousBadge";
import { useAuth } from "../context/AuthContext";
import ReportAccountModal from "../components/ReportAccountModal";
import ConnectionsModal from "../components/ConnectionsModal";

function formatProfilePostMeta(createdAt) {
  const createdDate = new Date(createdAt);
  const minutesSincePost = (Date.now() - createdDate.getTime()) / (1000 * 60);
  const hoursSincePost = minutesSincePost / 60;

  if (hoursSincePost < 24) {
    if (hoursSincePost < 1) {
      const roundedMinutes = Math.max(1, Math.floor(minutesSincePost));
      return `${roundedMinutes} minute${roundedMinutes === 1 ? "" : "s"} ago`;
    }

    const roundedHours = Math.floor(hoursSincePost);
    return `${roundedHours} hour${roundedHours === 1 ? "" : "s"} ago`;
  }

  return createdDate.toLocaleDateString();
}

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, syncUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [connectionsDialog, setConnectionsDialog] = useState({
    open: false,
    title: "",
    loading: false,
    users: []
  });

  const isOwnProfile = user?.username === username;

  async function loadProfile() {
    const { data } = await api.get(`/users/${username}`);
    setProfile(data.user);
    setPosts(data.posts);
    setBio(data.user.bio || "");
    setNewUsername(data.user.username || "");
    setFullName(data.user.fullName || "");
    setExternalUrl(data.user.externalUrl || "");
    setIsPrivate(Boolean(data.user.isPrivate));
  }

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (!profilePic) {
      setProfilePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profilePic);
    setProfilePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profilePic]);

  async function updatePrivacy(nextPrivateValue) {
    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("username", newUsername);
    formData.append("fullName", fullName);
    formData.append("externalUrl", externalUrl);
    formData.append("isPrivate", String(nextPrivateValue));

    const { data } = await api.put("/users/me", formData);
    setProfile(data.user);
    syncUser(data.user);
    setIsPrivate(Boolean(data.user.isPrivate));
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("username", newUsername);
    formData.append("fullName", fullName);
    formData.append("externalUrl", externalUrl);
    formData.append("isPrivate", String(isPrivate));

    if (profilePic) {
      formData.append("profilePic", profilePic);
    }

    const { data } = await api.put("/users/me", formData);
    setProfile(data.user);
    syncUser(data.user);
    setEditing(false);
    setProfilePic(null);

    if (data.user.username !== username) {
      navigate(`/profile/${data.user.username}`);
    }
  }

  async function handleFollowToggle() {
    await api.post(`/follows/${profile._id}`);
    await loadProfile();
  }

  async function openConnectionsDialog(type) {
    setConnectionsDialog({
      open: true,
      title: type === "followers" ? "Followers" : "Following",
      loading: true,
      users: []
    });

    try {
      const { data } = await api.get(`/follows/${profile.username}/${type}`);
      setConnectionsDialog({
        open: true,
        title: type === "followers" ? "Followers" : "Following",
        loading: false,
        users: data.users
      });
    } catch (_error) {
      setConnectionsDialog({
        open: true,
        title: type === "followers" ? "Followers" : "Following",
        loading: false,
        users: []
      });
    }
  }

  async function handleLikeToggle(postId) {
    const { data } = await api.post(`/posts/${postId}/like`);

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post._id !== postId) {
          return post;
        }

        const currentLikes = post.likes || [];
        const nextLikes = data.liked
          ? [...currentLikes, user._id]
          : currentLikes.filter((likeId) => String(likeId) !== String(user._id));

        return {
          ...post,
          likes: nextLikes
        };
      })
    );

    setSelectedPost((currentPost) => {
      if (!currentPost || currentPost._id !== postId) {
        return currentPost;
      }

      const currentLikes = currentPost.likes || [];
      const nextLikes = data.liked
        ? [...currentLikes, user._id]
        : currentLikes.filter((likeId) => String(likeId) !== String(user._id));

      return {
        ...currentPost,
        likes: nextLikes
      };
    });
  }

  async function handleModalComment(event) {
    event.preventDefault();

    if (!selectedPost || !commentText.trim()) {
      return;
    }

    const { data } = await api.post(`/posts/${selectedPost._id}/comments`, {
      text: commentText
    });

    setSelectedPost((currentPost) =>
      currentPost
        ? {
            ...currentPost,
            comments: [...(currentPost.comments || []), data.comment]
          }
        : currentPost
    );

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post._id === selectedPost._id
          ? {
              ...post,
              comments: [...(post.comments || []), data.comment]
            }
          : post
      )
    );

    setCommentText("");
  }

  if (!profile) {
    return (
      <Layout>
        <div className="glass-panel rounded-3xl p-6 shadow-card">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-coral/80">
              Profile Overview
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="rounded-[1.9rem] border border-orange-100/70 bg-gradient-to-br from-white via-sand to-blush/35 p-5 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="mx-auto md:mx-0">
                  <div className="rounded-full bg-gradient-to-br from-white via-blush/65 to-orange-50 p-2 shadow-[0_14px_30px_rgba(239,131,84,0.12)]">
                    <img
                      src={getImageUrl(profile.profilePic)}
                      alt={profile.username}
                      className="h-28 w-28 rounded-full object-cover md:h-36 md:w-36"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral/75">
                        {profile.isPrivate ? "Private profile" : "Public profile"}
                      </p>
                      <p className="mt-2 text-[2.1rem] font-semibold leading-none text-ink">
                        {profile.fullName?.trim() || profile.username}
                      </p>
                      <p className="mt-2 text-lg font-medium text-slate-500">@{profile.username}</p>
                    </div>

                    <p className="max-w-2xl text-[17px] leading-8 text-slate-700">
                      {profile.bio || "No bio yet."}
                    </p>

                    <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-500">
                      <span className="rounded-full bg-white/90 px-3.5 py-1.5 shadow-sm">
                        {profile.isPrivate ? "Followers approve requests" : "Anyone can view this profile"}
                      </span>
                      {profile.externalUrl ? (
                        <a
                          href={profile.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-white/90 px-3.5 py-1.5 font-semibold text-moss shadow-sm transition hover:bg-white"
                        >
                          Visit external link
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.35rem] bg-white/90 px-4 py-4 shadow-sm ring-1 ring-orange-100/70">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Posts
                      </p>
                      <p className="mt-1 text-[1.55rem] font-semibold leading-none text-ink">
                        {profile.stats.posts}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openConnectionsDialog("followers")}
                      className="rounded-[1.35rem] bg-white/90 px-4 py-4 text-left shadow-sm ring-1 ring-orange-100/70 transition hover:bg-white"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Followers
                      </p>
                      <p className="mt-1 text-[1.55rem] font-semibold leading-none text-ink">
                        {profile.stats.followers}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => openConnectionsDialog("following")}
                      className="rounded-[1.35rem] bg-white/90 px-4 py-4 text-left shadow-sm ring-1 ring-orange-100/70 transition hover:bg-white"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Following
                      </p>
                      <p className="mt-1 text-[1.55rem] font-semibold leading-none text-ink">
                        {profile.stats.following}
                      </p>
                    </button>
                  </div>

                <div className="mt-6">
                  {isOwnProfile ? (
                    <button
                      type="button"
                      onClick={() => setEditing((current) => !current)}
                        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-md shadow-slate-200 transition hover:bg-slate-700"
                      >
                        {editing ? "Close editor" : "Edit profile"}
                      </button>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleFollowToggle}
                        className="rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:bg-orange-500"
                      >
                        {profile.isFollowing ? "Unfollow" : "Follow"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/messages?user=${profile._id}`)}
                        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-orange-100 transition hover:bg-sand"
                      >
                        Message
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportDialogOpen(true)}
                        className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                          profile.hasReported
                            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                            : "bg-white text-coral shadow-sm ring-1 ring-orange-100 hover:bg-sand"
                        }`}
                      >
                        {profile.hasReported ? "Update report" : "Report account"}
                      </button>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.9rem] border border-orange-100 bg-gradient-to-br from-white via-blush/60 to-orange-50 p-5 shadow-[0_18px_35px_rgba(239,131,84,0.1)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">
                Account Signal
              </p>
              <div className="mt-4">
                <SuspiciousBadge isFake={profile.isFake} riskScore={profile.riskScore} />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Profile completeness, account age, posting history, and follower behavior all help
                shape this status.
              </p>

              <div className="mt-5 rounded-[1.35rem] bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current impression
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {profile.isFake
                    ? "Your account currently looks risky. A fuller profile and healthier activity can improve trust."
                    : "Your account is showing healthier trust signals right now."}
                </p>
              </div>
            </div>
          </div>

          {editing ? (
            <form
              onSubmit={handleProfileUpdate}
              className="mt-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white/85 via-sand to-blush/40 shadow-sm"
            >
              <div className="border-b border-orange-100/80 bg-gradient-to-r from-white/70 to-blush/50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral/80">
                  Profile Studio
                </p>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-lg font-semibold text-ink">Refresh your public identity</p>
                  <p className="text-sm text-slate-500">
                    Updates here can affect your suspicious account score.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <label className="rounded-[1.5rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Username
                  </span>
                  <input
                    value={newUsername}
                    onChange={(event) => setNewUsername(event.target.value)}
                    placeholder="Username"
                    className="mt-3 w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-slate-300"
                  />
                </label>

                <label className="rounded-[1.5rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Full Name
                  </span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Full name"
                    className="mt-3 w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-slate-300"
                  />
                </label>

                <label className="rounded-[1.5rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    External URL
                  </span>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="Add a link"
                    className="mt-3 w-full bg-transparent text-base font-medium text-ink outline-none placeholder:text-slate-300"
                  />
                </label>

                <div className="rounded-[1.5rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Account Visibility
                      </p>
                      <p className="mt-2 text-base font-semibold text-ink">
                        {isPrivate ? "Private account" : "Public account"}
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(event) => setIsPrivate(event.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="relative h-8 w-16 rounded-full bg-slate-200 transition peer-checked:bg-moss">
                        <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition peer-checked:left-9" />
                      </span>
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    Private accounts give you tighter control over who follows you.
                  </p>
                </div>

                <div className="md:col-span-2 rounded-[1.65rem] border border-coral/20 bg-gradient-to-br from-orange-50 via-white to-blush/70 p-1 shadow-[0_16px_35px_rgba(239,131,84,0.12)]">
                  <div className="grid gap-4 rounded-[1.45rem] border border-dashed border-coral/40 bg-white/85 p-4 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                    <label className="group cursor-pointer">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
                        Profile Image
                      </span>
                      <p className="mt-2 text-lg font-semibold text-ink">Upload a new avatar</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Square, portrait, or wide images all work nicely here.
                      </p>
                      <span className="mt-4 inline-flex rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition group-hover:bg-orange-500">
                        Choose image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setProfilePic(event.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    <div className="rounded-[1.35rem] bg-blush/45 p-3">
                      <img
                        src={profilePreviewUrl || getImageUrl(profile.profilePic)}
                        alt="Profile preview"
                        className="h-40 w-full rounded-[1.1rem] bg-white object-contain"
                      />
                    </div>
                  </div>
                </div>

                <label className="md:col-span-2 rounded-[1.5rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Bio
                    </span>
                    <span className="text-xs text-slate-400">{bio.length}/280</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(event) => setBio(event.target.value.slice(0, 280))}
                    rows="4"
                    placeholder="Tell people a little about yourself..."
                    className="w-full resize-none bg-transparent text-base text-ink outline-none placeholder:text-slate-300"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-orange-100/80 bg-white/40 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500">
                  Save your changes to refresh your profile across the app.
                </p>
                <button
                  type="submit"
                  className="rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-100 transition hover:bg-teal-700"
                >
                  Save changes
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="space-y-5">
          <div className="glass-panel rounded-[1.75rem] border border-white/60 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">
              Gallery
            </p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Posts</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tap any post to open the full details view.
                </p>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {profile.stats.posts} post{profile.stats.posts === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <section className="grid justify-center gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,360px))]">
          {posts.length ? (
            posts.map((post) => (
              <button
                key={post._id}
                type="button"
                onClick={() => {
                  setSelectedPost(post);
                  setCommentText("");
                }}
                className="glass-panel overflow-hidden rounded-[1.75rem] p-0 text-left shadow-card transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="bg-transparent p-2">
                  <img
                    src={getImageUrl(post.image)}
                    alt={post.caption}
                    className="aspect-[4/5] w-full rounded-[1.2rem] object-cover"
                  />
                </div>
              </button>
            ))
          ) : (
            <div className="glass-panel rounded-3xl p-6 shadow-card">
              No posts yet for this profile.
            </div>
          )}
          </section>
        </section>

        {selectedPost ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-sm"
            onClick={() => {
              setSelectedPost(null);
              setCommentText("");
            }}
          >
            <div
              className="glass-panel max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid max-h-[90vh] md:grid-cols-[minmax(0,1.15fr)_420px]">
                <div className="flex items-center justify-center bg-blush/35 p-4">
                  <img
                    src={getImageUrl(selectedPost.image)}
                    alt={selectedPost.caption}
                    className="max-h-[78vh] w-full rounded-[1.4rem] object-contain"
                  />
                </div>

                <div className="flex max-h-[90vh] flex-col border-t border-orange-100 bg-white/75 md:border-l md:border-t-0">
                  <div className="flex items-start justify-between gap-4 border-b border-orange-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(selectedPost.userId?.profilePic || profile.profilePic)}
                        alt={selectedPost.userId?.username || profile.username}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="space-y-0.5">
                        <p className="text-[1.05rem] font-semibold leading-5 text-ink">
                          {selectedPost.userId?.fullName?.trim() ||
                            profile.fullName ||
                            selectedPost.userId?.username ||
                            profile.username}
                        </p>
                        <p className="text-sm font-medium text-slate-500">
                          @{selectedPost.userId?.username || profile.username}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(null);
                        setCommentText("");
                      }}
                      aria-label="Close post popup"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-500 transition hover:text-ink"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                    <div>
                      <p className="text-[17px] leading-8 text-slate-700">
                        <span className="font-semibold text-[18px] text-ink">
                          {selectedPost.userId?.fullName?.trim() ||
                            profile.fullName ||
                            selectedPost.userId?.username ||
                            profile.username}
                        </span>{" "}
                        {selectedPost.caption || "No caption provided."}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {formatProfilePostMeta(selectedPost.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(selectedPost._id)}
                        aria-label={
                          selectedPost.likes?.some((likeId) => String(likeId) === String(user?._id))
                            ? "Unlike post"
                            : "Like post"
                        }
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition ${
                          selectedPost.likes?.some((likeId) => String(likeId) === String(user?._id))
                            ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {selectedPost.likes?.some((likeId) => String(likeId) === String(user?._id))
                          ? "♥"
                          : "♡"}
                      </button>
                      <span className="text-sm font-semibold text-slate-600">
                        {selectedPost.likes?.length || 0} likes
                      </span>
                    </div>

                    <div className="space-y-3 rounded-2xl bg-white/70 p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Comments
                      </h3>
                      <div className="space-y-3">
                        {selectedPost.comments?.length ? (
                          selectedPost.comments.map((comment) => (
                            <div
                              key={comment._id}
                              className="rounded-2xl bg-sand px-3 py-2 text-sm text-slate-700"
                            >
                              <span className="font-semibold">
                                {comment.userId?.fullName?.trim() || comment.userId?.username}
                              </span>{" "}
                              {comment.text}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No comments yet.</p>
                        )}
                      </div>

                      <form onSubmit={handleModalComment} className="flex gap-3">
                        <input
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 rounded-full border border-orange-100 bg-white px-4 py-2 outline-none focus:border-coral"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {reportDialogOpen && !isOwnProfile ? (
          <ReportAccountModal
            targetUser={profile}
            onClose={() => setReportDialogOpen(false)}
            onReported={() =>
              setProfile((currentProfile) => ({
                ...currentProfile,
                hasReported: true
              }))
            }
          />
        ) : null}

        {connectionsDialog.open ? (
          <ConnectionsModal
            title={connectionsDialog.title}
            users={connectionsDialog.users}
            loading={connectionsDialog.loading}
            onClose={() =>
              setConnectionsDialog({
                open: false,
                title: "",
                loading: false,
                users: []
              })
            }
          />
        ) : null}
      </div>
    </Layout>
  );
}

export default ProfilePage;
