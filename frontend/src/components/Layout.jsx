import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-ink md:px-8 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 md:flex-row xl:gap-8">
        <Navbar />
        <main className="flex-1 animate-rise">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
