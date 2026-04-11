import { useNavigate } from "react-router-dom";
import ResourcesPageShell from "../ResourcesPageShell";
import { formatEnumLabel, useResourcesModule } from "../useResourcesModule.jsx";

const ResourcesDashboardPageView = () => {
  const navigate = useNavigate();
  const {
    clearFilters,
    exportResourcesCsv,
    filters,
    maintenanceResources,
    recentlyAddedResources,
    resourceTypeSummary,
    setFilters,
    summary,
  } = useResourcesModule();

  return (
    <ResourcesPageShell showDashboardBackLink title="Resource Management Dashboard">
      <div className="mt-9 grid gap-6 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,246,246,0.86),rgba(218,229,241,0.72)_58%,rgba(100,148,164,0.28))] p-7 shadow-[0_22px_58px_rgba(2,26,84,0.18)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#021A54,#6494a4,#FFF6F6)]" />
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#6494a4]">Total Resources</p>
          <p className="mt-6 font-display text-5xl font-extrabold text-[#021A54]">{summary.total}</p>
          <p className="mt-4 text-sm font-semibold text-[#4f6672]">Catalogue items under control</p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,246,246,0.84),rgba(214,232,237,0.72)_58%,rgba(100,148,164,0.34))] p-7 shadow-[0_22px_58px_rgba(2,26,84,0.18)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#6494a4,#FFF6F6)]" />
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#6494a4]">Active Resources</p>
          <p className="mt-6 font-display text-5xl font-extrabold text-[#021A54]">{summary.active}</p>
          <p className="mt-4 text-sm font-semibold text-[#4f6672]">Ready for campus bookings</p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,246,246,0.84),rgba(219,228,242,0.72)_58%,rgba(136,151,189,0.32))] p-7 shadow-[0_22px_58px_rgba(2,26,84,0.18)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#8897BD,#FFF6F6)]" />
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#8897BD]">Out of Service</p>
          <p className="mt-6 font-display text-5xl font-extrabold text-[#021A54]">{summary.outOfService}</p>
          <p className="mt-4 text-sm font-semibold text-[#4f6672]">Needs review before release</p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,rgba(255,246,246,0.84),rgba(214,232,237,0.72)_58%,rgba(100,148,164,0.32))] p-7 shadow-[0_22px_58px_rgba(2,26,84,0.18)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FFF6F6,#8897BD,#6494a4)]" />
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#6494a4]">Resource Mix</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#021A54]/8 p-3">
              <p className="font-display text-3xl font-extrabold text-[#021A54]">{resourceTypeSummary.labs}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#4f6672]">Labs</p>
            </div>
            <div className="rounded-2xl bg-[#021A54]/8 p-3">
              <p className="font-display text-3xl font-extrabold text-[#021A54]">{resourceTypeSummary.rooms}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#4f6672]">Rooms</p>
            </div>
            <div className="rounded-2xl bg-[#021A54]/8 p-3">
              <p className="font-display text-3xl font-extrabold text-[#021A54]">{resourceTypeSummary.equipment}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#4f6672]">Items</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-9 rounded-3xl border border-white/65 bg-[linear-gradient(145deg,rgba(255,246,246,0.8),rgba(219,228,242,0.68)_58%,rgba(100,148,164,0.36))] p-7 shadow-[0_24px_68px_rgba(2,26,84,0.2)] backdrop-blur-2xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6494a4]">Quick Actions</p>
            <h2 className="font-display mt-2 text-4xl font-extrabold text-[#021A54]">Resource Controls</h2>
          </div>
          <span className="rounded-2xl border border-white/70 bg-[#FFF6F6]/66 px-5 py-3 text-sm font-black text-[#6494a4] shadow-sm backdrop-blur-xl">
            {summary.filtered} current results
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => navigate("/resources/add")}
            className="rounded-2xl bg-[#021A54] p-5 text-center text-white shadow-[0_16px_42px_rgba(2,26,84,0.22)] transition hover:-translate-y-1 hover:bg-[#0b2a70]"
          >
            <p className="text-xl font-extrabold">Add Resource</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/resources/bulk-import")}
            className="rounded-2xl border border-white/70 bg-[#FFF6F6]/62 p-5 text-center text-[#021A54] shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/82"
          >
            <p className="text-xl font-extrabold">Bulk Import</p>
          </button>
          <button
            type="button"
            onClick={() => navigate("/availability")}
            className="rounded-2xl bg-[#6494a4] p-5 text-center text-white shadow-[0_14px_34px_rgba(2,26,84,0.24)] transition hover:-translate-y-1 hover:bg-[#578797]"
          >
            <p className="text-xl font-extrabold">View Availability</p>
          </button>
          <button
            type="button"
            onClick={exportResourcesCsv}
            className="rounded-2xl border border-white/70 bg-[#FFF6F6]/62 p-5 text-center text-[#021A54] shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/82"
          >
            <p className="text-xl font-extrabold">Export CSV</p>
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-white/70 bg-[#FFF6F6]/62 p-5 text-center text-[#021A54] shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/82"
          >
            <p className="text-xl font-extrabold">Reset Filters</p>
          </button>
        </div>
      </section>

      <section className="mt-9 grid gap-6 xl:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl border border-[#FFF6F6]/22 bg-[linear-gradient(145deg,rgba(255,246,246,0.78),rgba(218,229,241,0.74))] p-7 shadow-[0_24px_64px_rgba(2,26,84,0.2)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#021A54,#6494a4)]" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6494a4]">Recently Added</p>
          <h3 className="font-display mt-2 text-3xl font-extrabold text-[#021A54]">Recent Resources</h3>
          <div className="mt-5 space-y-3">
            {recentlyAddedResources.length === 0 ? (
              <p className="rounded-2xl border border-[#021A54]/10 bg-white/58 px-4 py-3 text-sm font-semibold text-[#5c746d] backdrop-blur-xl">
                No resources yet.
              </p>
            ) : (
              recentlyAddedResources.map((resource) => (
                <article key={resource.id} className="rounded-2xl border border-[#021A54]/10 bg-white/58 px-4 py-3 shadow-sm backdrop-blur-xl">
                  <p className="font-extrabold text-[#021A54]">{resource.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#5c746d]">{formatEnumLabel(resource.type)}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#FFF6F6]/22 bg-[linear-gradient(145deg,rgba(255,246,246,0.78),rgba(218,229,241,0.74))] p-7 shadow-[0_24px_64px_rgba(2,26,84,0.2)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#6494a4,#8897BD)]" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6494a4]">Maintenance</p>
          <h3 className="font-display mt-2 text-3xl font-extrabold text-[#021A54]">Needs Attention</h3>
          <div className="mt-5 space-y-3">
            {maintenanceResources.length === 0 ? (
              <p className="rounded-2xl border border-[#021A54]/10 bg-white/58 px-4 py-3 text-sm font-semibold text-[#5c746d] backdrop-blur-xl">
                No out-of-service resources.
              </p>
            ) : (
              maintenanceResources.map((resource) => (
                <article key={resource.id} className="rounded-2xl border border-[#021A54]/20 bg-[#021A54]/8 px-4 py-3 shadow-sm backdrop-blur-xl">
                  <p className="font-extrabold text-[#021A54]">{resource.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#415985]">{resource.location}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-[#FFF6F6]/22 bg-[linear-gradient(145deg,rgba(255,246,246,0.78),rgba(218,229,241,0.74))] p-7 shadow-[0_24px_64px_rgba(2,26,84,0.2)] backdrop-blur-2xl">
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#8897BD,#6494a4)]" />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6494a4]">Quick Search</p>
          <h3 className="font-display mt-2 text-3xl font-extrabold text-[#021A54]">Find Resource</h3>
          <input
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search name, location, description"
            className="mt-5 w-full rounded-2xl border border-[#FFF6F6]/80 bg-[#FFF6F6]/66 px-4 py-3 text-[#021A54] outline-none transition focus:border-[#6494a4] focus:bg-[#FFF6F6]"
          />
          <button
            type="button"
            onClick={() => navigate(`/resources?search=${encodeURIComponent(filters.search)}`)}
            className="mt-4 w-full rounded-2xl bg-[#021A54] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b2a70]"
          >
            View Results
          </button>
        </div>
      </section>
    </ResourcesPageShell>
  );
};

export default ResourcesDashboardPageView;
