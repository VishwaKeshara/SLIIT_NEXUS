const resourceCategories = [
  {
    title: "Study Spaces",
    description: "Reserve collaborative rooms, quiet pods, and presentation-ready venues across campus.",
    meta: "Labs, meeting rooms, auditoriums",
  },
  {
    title: "Equipment Pool",
    description: "Track shared assets for classes and events, from projectors to media kits and loaner devices.",
    meta: "AV gear, laptops, peripherals",
  },
  {
    title: "Student Services",
    description: "Find operational counters, support desks, and service windows available through Nexus.",
    meta: "Service points and operating hours",
  },
];

const ResourcesPage = () => (
  <main className="min-h-screen bg-slate-50 px-4 pt-28">
    <div className="mx-auto max-w-6xl">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Campus resources</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Everything available to book, borrow, or locate.</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Use this space as the starting point for facilities, equipment, and shared services that authenticated
          users can access through SLIIT Nexus.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {resourceCategories.map((resource) => (
          <article key={resource.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{resource.meta}</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{resource.title}</h2>
            <p className="mt-3 text-slate-600">{resource.description}</p>
          </article>
        ))}
      </div>
    </div>
  </main>
);

export default ResourcesPage;
