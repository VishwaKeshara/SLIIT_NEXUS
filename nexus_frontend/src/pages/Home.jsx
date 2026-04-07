import { Link } from "react-router-dom";

const quickActions = [
  "Book lecture halls and labs in minutes",
  "Track maintenance tickets in real-time",
  "Receive web notifications for booking and ticket updates",
];

const features = [
  {
    title: "Smart Booking",
    description:
      "Reserve classrooms, labs, and meeting spaces with instant confirmation and conflict-free scheduling.",
  },
  {
    title: "Maintenance Desk",
    description:
      "Create, assign, and monitor maintenance tickets from submission to resolution with clear status updates.",
  },
  {
    title: "Resource Visibility",
    description:
      "See what facilities and assets are available right now to improve planning across faculties and departments.",
  },
];

const stats = [
  { label: "Active Students", value: "25K+" },
  { label: "Resources Managed", value: "1,200+" },
  { label: "Avg. Ticket Response", value: "< 30 min" },
];

const Home = () => {
  return (
    <main className="pt-24 bg-slate-50 min-h-screen">
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1">
              Welcome to SLIIT Nexus
            </p>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Smart Campus Operations, Unified in One Platform
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              SLIIT Nexus helps students, staff, and administrators manage bookings,
              resources, and support workflows with speed and clarity.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/bookings"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Booking
              </Link>
              <Link
                to="/tickets"
                className="bg-white text-slate-800 border border-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                Submit Ticket
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
            <ul className="mt-5 space-y-3">
              {quickActions.map((action) => (
                <li
                  key={action}
                  className="flex items-start gap-3 text-slate-700 bg-slate-50 rounded-lg px-4 py-3"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-xl p-5 text-center"
            >
              <p className="text-3xl font-extrabold text-slate-900">{item.value}</p>
              <p className="text-slate-600 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything You Need to Run Campus Smoothly</h2>
          <p className="text-slate-600 mt-3">
            Built for modern academic operations with a clean, connected workflow.
          </p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
