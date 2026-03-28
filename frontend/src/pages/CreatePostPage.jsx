import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CreatePostForm from "../components/CreatePostForm";

function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <CreatePostForm onPostCreated={() => navigate("/")} />

        <div className="glass-panel rounded-3xl p-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Create mode</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Share something new</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Upload any image ratio, add a caption, and post it to your profile and feed.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default CreatePostPage;
