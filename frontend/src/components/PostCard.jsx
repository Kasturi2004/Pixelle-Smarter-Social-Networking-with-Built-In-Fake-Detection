import { Link } from "react-router-dom";
import { useState } from "react";
import api, { getImageUrl } from "../api/client";
import SuspiciousBadge from "./SuspiciousBadge";
import { useAuth } from "../context/AuthContext";

function formatPostMeta(createdAt) {
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

function PostCard({ post }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [liked, setLiked] = useState(
    post.likes.some((likeId) => String(likeId) === String(user?._id))
  );
  const [comments, setComments] = useState(post.comments || []);
  const [showImagePreview, setShowImagePreview] = useState(false);

  async function handleLike() {
    const { data } = await api.post(`/posts/${post._id}/like`);
    setLiked(data.liked);
    setLikesCount(data.likesCount);
  }

  async function handleComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    const { data } = await api.post(`/posts/${post._id}/comments`, { text: commentText });
    setComments((currentComments) => [...currentComments, data.comment]);
    setCommentText("");
  }

  return (
    <article className="glass-panel rounded-[2rem] border border-white/60 p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <Link to={`/profile/${post.userId.username}`} className="flex items-center gap-3">
          <img
            src={getImageUrl(post.userId.profilePic)}
            alt={post.userId.username}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="space-y-0.5">
            <p className="text-[1.2rem] font-semibold leading-6 text-ink">
              {post.userId.fullName?.trim() || post.userId.username}
            </p>
            <p className="text-[15px] font-medium leading-5 text-slate-500">
              @{post.userId.username}
            </p>
          </div>
        </Link>
        <SuspiciousBadge isFake={post.userId.isFake} riskScore={post.userId.riskScore} />
      </div>

      <button
        type="button"
        onClick={() => setShowImagePreview(true)}
        className="mt-4 block w-full overflow-hidden rounded-[1.5rem] bg-transparent p-2 text-left"
      >
        <img
          src={getImageUrl(post.image)}
          alt={post.caption}
          className="max-h-[34rem] w-full rounded-[1.15rem] object-contain"
        />
      </button>

      <p className="mt-4 text-[17px] leading-8 text-slate-700">
        <span className="font-semibold text-[18px] text-ink">
          {post.userId.fullName?.trim() || post.userId.username}
        </span>{" "}
        {post.caption}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleLike}
          aria-label={liked ? "Unlike post" : "Like post"}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition ${
            liked ? "bg-rose-500 text-white shadow-md shadow-rose-200" : "bg-white text-slate-500"
          }`}
        >
          {liked ? "♥" : "♡"}
        </button>
        <span className="text-sm font-semibold text-slate-600">{likesCount} likes</span>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl bg-white/70 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Comments
        </h3>
        <div className="space-y-3">
          {comments.length ? (
            comments.map((comment) => (
              <div key={comment._id} className="rounded-2xl bg-sand px-3 py-2 text-sm">
                <span className="font-semibold">@{comment.userId.username}</span> {comment.text}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>

        <form onSubmit={handleComment} className="flex gap-3">
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

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {formatPostMeta(post.createdAt)}
      </p>

      {showImagePreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-8 backdrop-blur-sm"
          onClick={() => setShowImagePreview(false)}
        >
          <div
            className="glass-panel max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                aria-label="Close image preview"
                onClick={() => setShowImagePreview(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-500 transition hover:text-ink"
              >
                ×
              </button>
            </div>
            <img
              src={getImageUrl(post.image)}
              alt={post.caption}
              className="max-h-[78vh] w-full rounded-[1.4rem] object-contain"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default PostCard;
