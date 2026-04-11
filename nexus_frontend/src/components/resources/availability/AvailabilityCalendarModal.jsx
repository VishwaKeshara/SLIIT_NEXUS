import {
  calendarSlots,
  formatCalendarDay,
  formatEnumLabel,
  formatTimeLabel,
  getResourceAvailabilityLabel,
  getResourceCapacityLabel,
  toDateKey,
} from "../useResourcesModule.jsx";

const AvailabilityCalendarModal = ({
  availabilityResource,
  calendarDays,
  getNextSlot,
  getSlotClass,
  getSlotMeta,
  getSlotStatus,
  handleBookResource,
  onClose,
}) => {
  if (!availabilityResource) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#08231f]/65 px-4 py-8 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dbe7df] bg-[#103c35] p-6 text-white">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#d7eee6]">Resource Availability Calendar</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-[-0.04em]">{availabilityResource.name}</h2>
            <p className="mt-2 text-sm font-semibold text-[#d7eee6]">
              {formatEnumLabel(availabilityResource.type)} | {availabilityResource.location}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#f6e7a7]">
              {getResourceCapacityLabel(availabilityResource)} | {getResourceAvailabilityLabel(availabilityResource)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {availabilityResource.status === "ACTIVE" && (
              <button
                type="button"
                onClick={() => handleBookResource(availabilityResource)}
                className="rounded-full bg-[#f2d45c] px-5 py-2.5 text-sm font-extrabold text-[#103c35] transition hover:bg-[#f7df76]"
              >
                Book Now
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/12 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-6">
          {availabilityResource.status === "OUT_OF_SERVICE" && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
              This resource is currently OUT_OF_SERVICE. All calendar slots are blocked until the status changes.
            </div>
          )}

          <div className="mb-5 flex flex-wrap gap-3">
            <span className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
              Available
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800">
              Booked
            </span>
            <span className="rounded-full border border-amber-300 bg-[#fff7db] px-4 py-2 text-sm font-bold text-[#8a6a04]">
              Limited Availability
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800">
              Out of Service
            </span>
          </div>

          <div className="overflow-x-auto rounded-[1.4rem] border border-[#dbe7df]">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[120px_repeat(7,1fr)] bg-[#f3f8f5]">
                <div className="border-r border-[#dbe7df] p-3 text-sm font-black uppercase tracking-[0.12em] text-[#5b7493]">
                  Time
                </div>
                {calendarDays.map((day) => (
                  <div
                    key={toDateKey(day)}
                    className="border-r border-[#dbe7df] p-3 text-center text-sm font-black text-[#0f342e] last:border-r-0"
                  >
                    {formatCalendarDay(day)}
                  </div>
                ))}
              </div>

              {calendarSlots.map((slot) => (
                <div key={slot} className="grid grid-cols-[120px_repeat(7,1fr)] border-t border-[#dbe7df]">
                  <div className="border-r border-[#dbe7df] bg-[#f8fbf9] p-3 text-sm font-extrabold text-[#3e6259]">
                    {formatTimeLabel(slot)}
                  </div>
                  {calendarDays.map((day) => {
                    const slotMeta = getSlotMeta(availabilityResource, day, slot);
                    const status = getSlotStatus(availabilityResource, day, slot);
                    const isAvailable = status === "Available" || status === "Limited";

                    return (
                      <div key={`${toDateKey(day)}-${slot}`} className="border-r border-[#dbe7df] p-2 last:border-r-0">
                        <div className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${getSlotClass(status)}`}>
                          <p>{status}</p>
                          <p className="mt-1 text-[10px] font-semibold opacity-80">{slotMeta.detail}</p>
                          {isAvailable && (
                            <button
                              type="button"
                              onClick={() =>
                                handleBookResource(availabilityResource, {
                                  date: toDateKey(day),
                                  startTime: slot,
                                  endTime: getNextSlot(slot),
                                })
                              }
                              className="mt-2 rounded-lg bg-[#103c35] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-[#0b2e29]"
                            >
                              {status === "Limited" ? "Reserve Unit" : "Book"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#5c746d]">
            Booked slots are matched from active booking records for this resource. Other slots follow the resource
            availability window.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AvailabilityCalendarModal;
