import ResourcesSidebar from "./ResourcesSidebar";

const ResourcesLayout = ({ children, isAdmin, onLogout, subtitle, title }) => {
  return (
    <main className="min-h-screen bg-[#edf4fb] pt-6">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-4 pb-16 lg:flex-row lg:items-start lg:px-6">
        <ResourcesSidebar isAdmin={isAdmin} onLogout={onLogout} />

        <section className="min-w-0 flex-1">
          <header className="p-1 text-[#0f342e]">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#39766a]">
                  Smart Campus Operations Hub
                </p>
                <h1 className="font-display mt-3 text-5xl font-extrabold tracking-[-0.07em] text-[#0f342e] sm:text-6xl">
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
