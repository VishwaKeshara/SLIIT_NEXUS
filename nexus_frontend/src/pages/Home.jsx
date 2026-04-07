import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sliitCampusImage from "../assets/SLIIT-malabe.jpg";
import sliitBuildingImage from "../assets/download.webp";
import sliitLibraryImage from "../assets/SLIIT-Library-3.jpg";

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

const heroSlides = [
  {
    image: sliitCampusImage,
    alt: "SLIIT Malabe campus aerial view",
    eyebrow: "Welcome to SLIIT Nexus",
  },
  {
    image: sliitBuildingImage,
    alt: "SLIIT academic building entrance",
    eyebrow: "Explore campus spaces",
  },
  {
    image: sliitLibraryImage,
    alt: "SLIIT library learning area",
    eyebrow: "Connected student services",
  },
];

const Home = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="pt-24 bg-slate-50 min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.alt}
              src={slide.image}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.88)_0%,rgba(15,23,42,0.72)_38%,rgba(15,23,42,0.26)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(30,64,175,0.08)_0%,rgba(15,23,42,0.48)_100%)]" />

          <div className="relative grid min-h-[34rem] items-end gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
            <div className="max-w-3xl self-center">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {heroSlides[activeSlide].eyebrow}
              </p>
              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                Smart Campus Operations, Unified in One Platform
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                SLIIT Nexus helps students, staff, and administrators manage bookings, resources, and support
                workflows with speed and clarity across the Malabe campus.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/bookings"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Start Booking
                </Link>
                <Link
                  to="/tickets"
                  className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Submit Ticket
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.alt}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeSlide ? "w-10 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
                    }`}
                    aria-label={`Show hero slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-white/12 p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              <ul className="mt-5 space-y-3">
                {quickActions.map((action) => (
                  <li
                    key={action}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-slate-100"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
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
