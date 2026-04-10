const pillars = [
  {
    title: "Centralized access",
    description: "Resources, bookings, tickets, and notices are managed from one campus workspace.",
  },
  {
    title: "Operational clarity",
    description: "Students, staff, managers, and support teams can follow requests with clear status updates.",
  },
  {
    title: "Role-aware control",
    description: "Access is structured so administrators can manage workflows while users keep their tasks simple.",
  },
];

const AboutUsPage = () => (
  <main className="min-h-screen bg-[#eef5f2] px-4 pb-16 pt-28 text-[#062321]">
    <div className="mx-auto max-w-6xl">
      <section className="grid overflow-hidden rounded-lg border border-[#cddfd8] bg-white shadow-[0_24px_70px_rgba(3,27,26,0.12)] lg:grid-cols-[1fr_0.9fr]">
        <div className="p-8 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f8a74]">About SLIIT Nexus</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-[#18463d] sm:text-5xl">
            A digital workspace for smarter campus operations.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#42665c]">
            SLIIT Nexus helps campus users find resources, submit bookings, raise maintenance tickets, and follow
            operational updates through a single organized platform.
          </p>
        </div>
        <div
          className="min-h-[280px] bg-cover bg-center"
          style={{ backgroundImage: "url('/sliit-campus-bg.jpeg')" }}
          aria-label="SLIIT campus"
        />
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-lg border border-[#cddfd8] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#18463d]">{pillar.title}</h2>
            <p className="mt-3 leading-7 text-[#42665c]">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-[#cddfd8] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f8a74]">What the platform supports</p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {["Resource catalogue", "Booking requests", "Maintenance tickets", "Notifications"].map((item) => (
            <div key={item} className="rounded-lg bg-[#f4faf7] p-4 text-sm font-bold text-[#18463d]">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  </main>
);

export default AboutUsPage;
