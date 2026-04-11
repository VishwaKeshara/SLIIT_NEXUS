import {
  campusLocations,
  formatEnumLabel,
  formatTimeLabel,
  resourceStatuses,
  resourceTypes,
} from "../useResourcesModule.jsx";

const ResourceCatalogueSection = ({
  activeMode = "resources",
  catalogueError,
  clearFilters,
  deletingId,
  deleteResource,
  filteredResources,
  filterLocationOptions,
  filters,
  formMessage,
  handleBookResource,
  handleFilterChange,
  handleInlineFormChange,
  handleInlineSubmit,
  inlineEditingId,
  inlineFormErrors,
  inlineFormState,
  inlineSubmitting,
  isAdmin,
  loading,
  loadResources,
  setAvailabilityResource,
  startInlineEdit,
  cancelInlineEdit,
}) => {
  const isAvailabilityMode = activeMode === "availability";

  return (
    <section id="resources" className="mt-9 rounded-[2rem] bg-white p-7 shadow-[0_20px_48px_rgba(15,52,46,0.08)] ring-1 ring-[#dbe7ef] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">
            {isAvailabilityMode ? "Availability" : "Catalogue"}
          </p>
          <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
            {isAvailabilityMode ? "Resource Availability Calendar" : "Resource Catalogue"}
          </h2>
        </div>
        <button
          type="button"
          onClick={loadResources}
          className="rounded-[1.2rem] bg-[#eef3fb] px-5 py-3 text-sm font-black text-[#0f342e] shadow-sm transition hover:bg-[#e3edf8]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          name="search"
          type="text"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name or location..."
          className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] xl:col-span-2"
        />

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
          className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
        >
          <option value="">All Types</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </select>

        <input
          name="capacity"
          type="number"
          min="1"
          value={filters.capacity}
          onChange={handleFilterChange}
          placeholder="Min Capacity"
          className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
        />

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7]"
        >
          <option value="">All Status</option>
          {resourceStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
          className="rounded-[1rem] border border-[#dbe7df] bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:border-[#39766a] focus:ring-4 focus:ring-[#dceee7] md:col-span-2 xl:col-span-5"
        >
          <option value="">All Locations</option>
          {filterLocationOptions.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29]"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-[1rem] bg-[#6b7f78] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#52645f]"
        >
          Reset Filters
        </button>
      </div>

      {formMessage && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
            formMessage.toLowerCase().includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {formMessage}
        </p>
      )}

      <div id="availability" className="mt-5 rounded-2xl border border-[#dbe7df] bg-[#f3f8f5] px-4 py-3 text-sm font-semibold text-[#39766a]">
        Use the `View Availability` button on any resource card to open the weekly availability calendar.
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-[1.4rem] border border-[#dbe7df] bg-[#f8fbf9] p-8 text-center font-semibold text-[#5c746d]">
            Loading resources...
          </div>
        ) : catalogueError ? (
          <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-8 text-center font-semibold text-red-700">
            {catalogueError}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-[1.4rem] border border-[#dbe7df] bg-[#f8fbf9] p-8 text-center font-semibold text-[#5c746d]">
            No resources found.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredResources.map((resource) => (
              <article
                key={resource.id}
                className="group relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/65 p-5 shadow-[0_18px_44px_rgba(15,52,46,0.12)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#c5ded4] hover:bg-white/80 hover:shadow-[0_26px_58px_rgba(15,52,46,0.18)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.75),rgba(226,241,235,0.42))]" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#103c35]/10 blur-2xl transition group-hover:bg-[#103c35]/16" />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0f342e]">{resource.name}</h3>
                      <p className="mt-2 inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#39766a] ring-1 ring-[#dbe7df]">
                        {formatEnumLabel(resource.type)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] shadow-sm ${
                        resource.status === "ACTIVE"
                          ? "bg-green-100/90 text-green-800 ring-1 ring-green-200"
                          : "bg-red-100/90 text-red-800 ring-1 ring-red-200"
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-[#3e6259]">
                    <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Capacity</p>
                      <p className="mt-1 font-extrabold text-[#0f342e]">{resource.capacity}</p>
                    </div>
                    <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Location</p>
                      <p className="mt-1 font-extrabold text-[#0f342e]">{resource.location}</p>
                    </div>
                    <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Availability</p>
                      <p className="mt-1 font-extrabold text-[#0f342e]">
                        {formatTimeLabel(resource.availableFrom)} - {formatTimeLabel(resource.availableTo)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] bg-white/70 p-3 ring-1 ring-white/80">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a918a]">Description</p>
                      <p className="mt-1 font-semibold text-[#3e6259]">{resource.description || "N/A"}</p>
                    </div>
                  </div>

                  {inlineEditingId === resource.id && (
                    <div className="mt-5 rounded-[1.3rem] border border-[#dbe7df] bg-white/80 p-4 shadow-inner">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block md:col-span-2">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Name</span>
                          <input
                            name="name"
                            value={inlineFormState.name}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.name ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          />
                          {inlineFormErrors.name && <p className="mt-1 text-xs font-bold text-red-600">{inlineFormErrors.name}</p>}
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Type</span>
                          <select
                            name="type"
                            value={inlineFormState.type}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.type ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          >
                            <option value="">Select type</option>
                            {resourceTypes.map((type) => (
                              <option key={type} value={type}>
                                {formatEnumLabel(type)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Capacity</span>
                          <input
                            name="capacity"
                            type="number"
                            min="1"
                            value={inlineFormState.capacity}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.capacity ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          />
                        </label>

                        <label className="block md:col-span-2">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Location</span>
                          <select
                            name="location"
                            value={inlineFormState.location}
                            onChange={handleInlineFormChange}
                            disabled={!inlineFormState.type}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] disabled:bg-[#eef3f0] ${
                              inlineFormErrors.location ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          >
                            <option value="">{inlineFormState.type ? "Select campus location" : "Select type first"}</option>
                            {(campusLocations[inlineFormState.type] ?? []).map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">From</span>
                          <input
                            name="availableFrom"
                            type="time"
                            value={inlineFormState.availableFrom}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.availableFrom ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">To</span>
                          <input
                            name="availableTo"
                            type="time"
                            value={inlineFormState.availableTo}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.availableTo ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          />
                          {inlineFormErrors.availableTo && (
                            <p className="mt-1 text-xs font-bold text-red-600">{inlineFormErrors.availableTo}</p>
                          )}
                        </label>

                        <label className="block md:col-span-2">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Status</span>
                          <select
                            name="status"
                            value={inlineFormState.status}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.status ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          >
                            <option value="">Select status</option>
                            {resourceStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block md:col-span-2">
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-[#39766a]">Description</span>
                          <textarea
                            name="description"
                            rows="3"
                            value={inlineFormState.description}
                            onChange={handleInlineFormChange}
                            className={`mt-2 w-full rounded-[0.9rem] border bg-[#f8fbf9] px-3 py-2 text-sm font-semibold text-[#0f342e] outline-none focus:border-[#39766a] ${
                              inlineFormErrors.description ? "border-red-400" : "border-[#dbe7df]"
                            }`}
                          />
                          {inlineFormErrors.description && (
                            <p className="mt-1 text-xs font-bold text-red-600">{inlineFormErrors.description}</p>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAvailabilityResource(resource)}
                      className="rounded-[1rem] bg-[#103c35] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(16,60,53,0.18)] transition hover:bg-[#0b2e29]"
                    >
                      View Availability
                    </button>
                    {resource.status === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => handleBookResource(resource)}
                        className="rounded-[1rem] bg-[#f2d45c] px-4 py-2.5 text-sm font-bold text-[#103c35] shadow-[0_10px_20px_rgba(92,75,6,0.12)] transition hover:bg-[#f7df76]"
                      >
                        Book Now
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {inlineEditingId === resource.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleInlineSubmit(resource.id)}
                            disabled={inlineSubmitting}
                            className="rounded-[1rem] bg-[#f2d45c] px-4 py-2.5 text-sm font-bold text-[#103c35] shadow-[0_10px_20px_rgba(92,75,6,0.12)] transition hover:bg-[#f7df76] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {inlineSubmitting ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="rounded-[1rem] bg-[#6b7f78] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#52645f]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startInlineEdit(resource)}
                          className="rounded-[1rem] bg-[#f2d45c] px-4 py-2.5 text-sm font-bold text-[#103c35] shadow-[0_10px_20px_rgba(92,75,6,0.12)] transition hover:bg-[#f7df76]"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteResource(resource)}
                        disabled={deletingId === resource.id}
                        className="rounded-[1rem] bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(185,28,28,0.14)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === resource.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourceCatalogueSection;
