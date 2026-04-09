const pillars = [
  {
    title: "Unified campus flow",
    description: "One platform for resources, bookings, incidents, and operational updates across departments.",
  },
  {
    title: "Faster response loops",
    description: "Students, staff, and support teams stay aligned through shared status updates and notifications.",
  },
  {
    title: "Clear accountability",
    description: "Role-based access keeps every action visible, traceable, and easier to manage at scale.",
  },
];

const AboutUsPage = () => (
  <main className="min-h-screen bg-slate-100 px-4 pt-28">
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">About SLIIT Nexus</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black">A smart campus hub designed to simplify daily operations.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50">
          SLIIT Nexus brings together facility access, service coordination, and communication so authenticated users
          can move from request to resolution with less friction.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">{pillar.title}</h2>
            <p className="mt-3 text-slate-600">{pillar.description}</p>
          </article>
        ))}
      </section>
    </div>
  </main>
);

export default AboutUsPage;
