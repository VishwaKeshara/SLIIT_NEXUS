import ResourcesPageShell from "../ResourcesPageShell";
import {
  formatEnumLabel,
  getResourceAvailabilityLabel,
  getResourceCapacityLabel,
  isSharedEquipmentResource,
  resourceStatuses,
  resourceTypes,
  useResourcesModule,
} from "../useResourcesModule.jsx";

const AddResourcePageView = () => {
  const {
    editingId,
    formErrors,
    formLocationOptions,
    formMessage,
    formState,
    handleFormChange,
    handleSubmit,
    resetForm,
    submitting,
    suggestedResourceDrafts,
    applySuggestedResource,
  } = useResourcesModule();

  return (
    <ResourcesPageShell
      subtitle="Create a new resource or update the selected resource with validated campus data."
      title={editingId ? "Edit Resource" : "Add Resource"}
    >
      <section
        id="add-resource"
        className="mt-9 overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(242,212,92,0.2),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.78),rgba(226,241,235,0.5))] p-7 shadow-[0_24px_58px_rgba(15,52,46,0.14)] backdrop-blur-xl sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#39766a]">Admin Tool</p>
            <h2 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.06em] text-[#0f342e]">
              {editingId ? "Edit Resource" : "Add Resource"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-[1rem] bg-[#f3f8f5] px-4 py-2 text-sm font-bold text-[#0f342e] transition hover:bg-[#e6f0eb]"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          className="mt-6 rounded-[1.6rem] border border-white/80 bg-white/55 p-5 shadow-inner backdrop-blur-xl sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <label className="block">
            <span className="text-sm font-bold text-[#0f342e]">Resource Name</span>
            <input
              name="name"
              value={formState.name}
              onChange={handleFormChange}
              placeholder="Enter resource name"
              className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                formErrors.name ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
              }`}
            />
            {formErrors.name && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.name}</p>}
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#0f342e]">Resource Type</span>
              <select
                name="type"
                value={formState.type}
                onChange={handleFormChange}
                className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                  formErrors.type ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                }`}
              >
                <option value="">Select type</option>
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>
              {formErrors.type && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.type}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#0f342e]">Capacity</span>
              <input
                name="capacity"
                type="number"
                min="1"
                value={formState.capacity}
                onChange={handleFormChange}
                disabled={formState.type === "EQUIPMENT" && !formState.sharedResource}
                placeholder={formState.type === "EQUIPMENT" && !formState.sharedResource ? "Locked to 1 for individual equipment" : "Enter capacity"}
                className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] disabled:cursor-not-allowed disabled:bg-[#eef3f0] ${
                  formErrors.capacity ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                }`}
              />
              {formErrors.capacity && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.capacity}</p>}
            </label>
          </div>

          {formState.type === "EQUIPMENT" && (
            <div className="mt-4 rounded-[1.3rem] border border-[#dbe7df] bg-[#f8fbf9] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#0f342e]">Equipment Capacity Mode</p>
                  <p className="text-xs font-semibold leading-5 text-[#5c746d]">
                    Individual equipment such as cameras and laptops stay fixed at 1. Turn this on only for grouped or
                    shared equipment pools.
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 rounded-full border border-[#dbe7df] bg-white px-4 py-2 text-sm font-bold text-[#0f342e]">
                  <input
                    name="sharedResource"
                    type="checkbox"
                    checked={formState.sharedResource}
                    onChange={handleFormChange}
                    className="h-4 w-4 rounded border-[#b6ccc4] text-[#103c35] focus:ring-[#39766a]"
                  />
                  Shared equipment pool
                </label>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7a918a]">Capacity Rule</p>
                  <p className="mt-2 text-sm font-bold text-[#0f342e]">
                    {formState.sharedResource
                      ? "Shared equipment can accept multiple concurrent bookings until all units are reserved."
                      : "Individual equipment is limited to a single unit and one active booking per time slot."}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-white bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7a918a]">Display Preview</p>
                  <p className="mt-2 text-sm font-bold text-[#0f342e]">
                    {getResourceCapacityLabel({
                      type: formState.type,
                      capacity: Number(formState.capacity || 0),
                      sharedResource: formState.sharedResource,
                    })}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#5c746d]">
                    {getResourceAvailabilityLabel({
                      type: formState.type,
                      status: formState.status,
                      sharedResource: formState.sharedResource,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {formState.type && (
            <div className="mt-4 rounded-[1.3rem] border border-[#dbe7df] bg-[#f3f8f5] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#0f342e]">Suggested Resources</p>
                  <p className="text-xs font-semibold text-[#5c746d]">
                    Pick a suggestion to auto-fill the form with a ready-made setup.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#39766a]">
                  {formatEnumLabel(formState.type)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {suggestedResourceDrafts.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.name}-${suggestion.location}`}
                    type="button"
                    onClick={() => applySuggestedResource(suggestion)}
                    className="rounded-[1.1rem] border border-white bg-white px-4 py-4 text-left shadow-[0_12px_30px_rgba(15,52,46,0.07)] transition hover:-translate-y-0.5 hover:border-[#bfd5cc]"
                  >
                    <p className="text-sm font-extrabold text-[#0f342e]">{suggestion.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#5c746d]">{suggestion.location || "Select location"}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#39766a]">
                      <span className="rounded-full bg-[#eef5f1] px-2.5 py-1">
                        {isSharedEquipmentResource(suggestion) ? `${suggestion.capacity} Unit Pool` : `Cap ${suggestion.capacity}`}
                      </span>
                      {suggestion.type === "EQUIPMENT" && (
                        <span className="rounded-full bg-[#fff7db] px-2.5 py-1 text-[#856404]">
                          {isSharedEquipmentResource(suggestion) ? "Shared" : "Individual"}
                        </span>
                      )}
                      <span className="rounded-full bg-[#eef5f1] px-2.5 py-1">
                        {suggestion.availableFrom} - {suggestion.availableTo}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#5c746d]">{suggestion.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="mt-4 block">
            <span className="text-sm font-bold text-[#0f342e]">Campus Location</span>
            <select
              name="location"
              value={formState.location}
              onChange={handleFormChange}
              disabled={!formState.type}
              className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] disabled:bg-[#eef3f0] ${
                formErrors.location ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
              }`}
            >
              <option value="">{formState.type ? "Select campus location" : "Select resource type first"}</option>
              {formLocationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            {formErrors.location && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.location}</p>}
            <p className="mt-2 rounded-[1rem] border border-[#dbe7df] bg-[#f3f8f5] px-3 py-2 text-sm font-semibold text-[#39766a]">
              Location list updates automatically based on the selected resource type.
            </p>
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-[#0f342e]">Available From</span>
              <input
                name="availableFrom"
                type="time"
                value={formState.availableFrom}
                onChange={handleFormChange}
                className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                  formErrors.availableFrom ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                }`}
              />
              {formErrors.availableFrom && (
                <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableFrom}</p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#0f342e]">Available To</span>
              <input
                name="availableTo"
                type="time"
                value={formState.availableTo}
                onChange={handleFormChange}
                className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                  formErrors.availableTo ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
                }`}
              />
              {formErrors.availableTo && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.availableTo}</p>}
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-[#0f342e]">Status</span>
            <select
              name="status"
              value={formState.status}
              onChange={handleFormChange}
              className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                formErrors.status ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
              }`}
            >
              <option value="">Select status</option>
              {resourceStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {formErrors.status && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.status}</p>}
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-[#0f342e]">Description</span>
            <textarea
              name="description"
              rows="3"
              value={formState.description}
              onChange={handleFormChange}
              placeholder="Enter short description"
              className={`mt-2 w-full rounded-[1rem] border bg-[#f8fbf9] px-4 py-3 text-[#0f342e] outline-none transition focus:ring-4 focus:ring-[#dceee7] ${
                formErrors.description ? "border-red-400" : "border-[#dbe7df] focus:border-[#39766a]"
              }`}
            />
            {formErrors.description && <p className="mt-1 text-sm font-semibold text-red-600">{formErrors.description}</p>}
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-[1rem] bg-[#103c35] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b2e29] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingId ? "Update Resource" : "Save Resource"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-[1rem] bg-[#6b7f78] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#52645f]"
            >
              Clear
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

          <p className="mt-4 text-sm leading-6 text-[#5c746d]">
            This version uses predefined campus locations instead of manual typing.
          </p>
        </form>
      </section>
    </ResourcesPageShell>
  );
};

export default AddResourcePageView;
