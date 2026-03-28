import { useEffect, useState } from "react";
import api from "../api/client";

function CreatePostForm({ onPostCreated }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!image) {
      setError("Please choose an image.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("image", image);

      const { data } = await api.post("/posts", formData);
      setCaption("");
      setImage(null);
      setPreviewUrl("");
      event.target.reset();
      onPostCreated(data.post);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel overflow-hidden rounded-[2rem] border border-white/60 p-0 shadow-card"
    >
      <div className="border-b border-orange-100/80 bg-gradient-to-r from-white/70 via-blush/70 to-white/40 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-coral/80">
            New Moment
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Create a new post</h2>
          <p className="mt-1 text-sm text-slate-500">
            Share a photo and caption with your followers.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="rounded-[1.9rem] border border-coral/30 bg-gradient-to-br from-orange-50 via-white to-blush/80 p-1 shadow-[0_18px_40px_rgba(239,131,84,0.14)]">
          <label className="group flex cursor-pointer items-center justify-between gap-4 rounded-[1.6rem] border border-dashed border-coral/50 bg-white/85 px-5 py-5 transition hover:border-coral hover:bg-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral">
                Upload image
              </p>
              <p className="mt-2 text-base font-medium text-slate-600">
                {image ? "Image selected and ready to preview" : "Choose a photo for your post"}
              </p>
            </div>
            <span className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition group-hover:scale-[1.03] group-hover:bg-orange-500">
              Browse
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {image ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Image preview</p>
              <p className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-coral">
                Any ratio supported
              </p>
            </div>
            <div className="bg-blush/40 p-4">
              <img
                src={previewUrl}
                alt="Selected upload preview"
                className="max-h-[28rem] w-full rounded-[1.25rem] bg-white object-contain"
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-[1.75rem] border border-orange-100 bg-white/85 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-600">Caption</label>
            <span className="text-xs text-slate-400">{caption.length}/220</span>
          </div>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, 220))}
            rows="3"
            placeholder="Write a caption..."
            className="w-full resize-none rounded-[1.25rem] bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[1.5rem] bg-coral px-7 py-4 font-semibold text-white shadow-lg shadow-orange-200/60 transition hover:-translate-y-0.5 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>

      {error ? <p className="px-6 pb-6 text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}

export default CreatePostForm;
