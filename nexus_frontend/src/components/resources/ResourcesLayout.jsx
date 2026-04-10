import ResourcesSidebar from "./ResourcesSidebar";

const ResourcesLayout = ({ children, isAdmin, onLogout, showDashboardBackLink = false, subtitle, title }) => {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(100deg,#021A54_0%,#395f91_28%,#d6e5ed_62%,#FFF6F6_100%)] pt-6">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[linear-gradient(90deg,rgba(2,26,84,0.24),rgba(100,148,164,0.18),rgba(255,246,246,0.46))]" />
      <div className="relative mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <ResourcesSidebar isAdmin={isAdmin} onLogout={onLogout} showDashboardBackLink={showDashboardBackLink} />

        <section className="min-w-0 flex-1">
          <header className="rounded-lg border border-white/70 bg-[#FFF6F6]/82 p-6 text-[#021A54] shadow-[0_22px_64px_rgba(2,26,84,0.18)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6494a4]">
                  Smart Campus Operations Hub
                </p>
                <h1 className="font-display mt-3 text-4xl font-extrabold text-[#021A54] sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-base font-semibold text-[#5c746d] sm:text-lg">{subtitle}</p>
              </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
};

export default ResourcesLayout;
