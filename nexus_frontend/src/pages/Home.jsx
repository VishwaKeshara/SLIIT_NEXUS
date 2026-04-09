import { Link } from "react-router-dom";

const moduleCards = [
  {
    title: "Module A",
    subtitle: "Facilities and Assets Catalogue",
    description: "Maintain rooms, labs, and equipment with capacity, location, availability windows, and status.",
    tag: "In Progress",
  },
  {
    title: "Module B",
    subtitle: "Booking Management",
    description: "Approve or reject requests, prevent schedule conflicts, and keep full visibility of bookings.",
    tag: "Core Workflow",
  },
  {
    title: "Module C",
    subtitle: "Maintenance and Incident Ticketing",
    description: "Capture incidents, assign technicians, and track OPEN to CLOSED ticket life cycles.",
    tag: "Service Desk",
  },
  {
    title: "Module D",
    subtitle: "Notifications",
    description: "Deliver real-time updates for approvals, rejections, ticket status changes, and comments.",
    tag: "User Experience",
  },
  {
    title: "Module E",
    subtitle: "Authentication and Authorization",
    description: "Secure operations with OAuth login and role-based access for USER, ADMIN, and staff roles.",
    tag: "Security",
  },
];

const qualityChecklist = [
  "RESTful API design with clean layered architecture",
  "Role-based access control and secure route protection",
  "Validation and consistent error handling",
  "Database persistence for production-like behavior",
  "Testability and CI-ready development workflow",
];

const Home = () => {
  return (
    <main
      className="min-h-screen pt-24"
      style={{
        background:
          "radial-gradient(1200px 500px at 15% 0%, #B0E4CC 0%, #FFF6F6 55%, #FFF6F6 100%)",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-[#285A48] bg-[#B0E4CC]">
              IT3030 PAF Assignment 2026
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-[#091413] md:text-5xl">
              Smart Campus Operations Hub for SLIIT
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[#285A48]">
              A professional web platform built with Spring Boot and React to manage facility bookings, campus assets,
              maintenance incidents, and operational notifications in one connected workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/resources"
                className="rounded-xl border border-[#285A48] bg-[#285A48] px-5 py-3 font-semibold text-[#FFF6F6] transition hover:bg-[#091413]"
              >
                Manage Resources
              </Link>
              <Link
                to="/bookings"
                className="rounded-xl border border-[#091413] bg-[#091413] px-5 py-3 font-semibold text-[#FFF6F6] transition hover:bg-[#285A48]"
              >
                Booking Workflow
              </Link>
              <Link
                to="/tickets"
                className="rounded-xl border border-[#408A71] bg-[#FFF6F6] px-5 py-3 font-semibold text-[#285A48] transition hover:bg-[#B0E4CC]"
              >
                Incident Desk
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#408A71]/40 bg-[#FFF6F6]/90 p-6 shadow-[0_16px_40px_rgba(40,90,72,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#408A71]">Operational Flow</p>
            <h2 className="mt-2 text-2xl font-bold text-[#091413]">Campus Workflows at a Glance</h2>
            <ul className="mt-5 space-y-3 text-[#285A48]">
              {[
                "Catalogue resources with status and availability windows",
                "Receive booking requests and apply approval decisions",
                "Track maintenance tickets with technician updates",
                "Notify users for status changes and discussion comments",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-[#B0E4CC] bg-[#FFF6F6] px-4 py-3"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#408A71]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Core Modules", value: "5" },
            { label: "Required Roles", value: "USER / ADMIN" },
            { label: "Target Stack", value: "Spring + React" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#B0E4CC] bg-[#FFF6F6] p-5 text-center">
              <p className="text-3xl font-extrabold text-[#091413]">{item.value}</p>
              <p className="mt-1 text-[#285A48]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#091413]">Assignment Feature Modules</h2>
            <p className="mt-2 text-[#285A48]">Designed around your assignment guideline requirements.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((module) => (
            <article
              key={module.title}
              className="rounded-2xl border border-[#B0E4CC] bg-[#FFF6F6] p-6 shadow-[0_10px_25px_rgba(40,90,72,0.1)]"
            >
              <span className="inline-flex rounded-full bg-[#B0E4CC] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#285A48]">
                {module.tag}
              </span>
              <h3 className="mt-3 text-xl font-bold text-[#091413]">{module.title}</h3>
              <p className="mt-1 font-semibold text-[#285A48]">{module.subtitle}</p>
              <p className="mt-3 leading-relaxed text-[#285A48]">{module.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="rounded-2xl border border-[#408A71]/40 bg-[#091413] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#FFF6F6]">Engineering Quality Focus</h2>
          <p className="mt-2 text-[#B0E4CC]">The system is structured for maintainability, security, and viva readiness.</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {qualityChecklist.map((item) => (
              <li key={item} className="rounded-xl border border-[#408A71]/60 bg-[#285A48]/40 px-4 py-3 text-[#FFF6F6]">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Home;
