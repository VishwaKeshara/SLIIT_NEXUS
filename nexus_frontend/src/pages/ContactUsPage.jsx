const supportCards = [
  { title: "Resource Support", detail: "resources@sliitnexus.com", note: "Catalogue access, locations, capacity, and availability." },
  { title: "Booking Help", detail: "bookings@sliitnexus.com", note: "Reservation status, schedule changes, and check-in support." },
  { title: "Ticketing Desk", detail: "tickets@sliitnexus.com", note: "Maintenance issues, incident updates, and assignment follow-ups." },
];

const ContactUsPage = () => (
  <main className="min-h-screen bg-[#eef5f2] px-4 pb-16 pt-28 text-[#062321]">
    <div className="mx-auto max-w-6xl">
      <section className="rounded-lg border border-[#cddfd8] bg-white p-8 shadow-[0_24px_70px_rgba(3,27,26,0.12)] sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f8a74]">Contact Us</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-[#18463d] sm:text-5xl">
          Get support from the right campus operations team.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#42665c]">
          Use the channels below for resource access, booking assistance, ticket progress, and general platform support.
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {supportCards.map((card) => (
          <article key={card.title} className="rounded-lg border border-[#cddfd8] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#18463d]">{card.title}</h2>
            <p className="mt-3 font-bold text-[#2f8a74]">{card.detail}</p>
            <p className="mt-3 leading-7 text-[#42665c]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#cddfd8] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#18463d]">Campus Operations Office</h2>
          <div className="mt-5 space-y-3 text-[#42665c]">
            <p>SLIIT Nexus Support Desk</p>
            <p>Weekdays: 8.30 AM - 5.00 PM</p>
            <p>General: support@sliitnexus.com</p>
          </div>
        </div>

        <form className="rounded-lg border border-[#cddfd8] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#18463d]">Send a Message</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-lg border border-[#cddfd8] px-4 py-3 outline-none focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
              placeholder="Your name"
            />
            <input
              className="rounded-lg border border-[#cddfd8] px-4 py-3 outline-none focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db]"
              placeholder="Email address"
              type="email"
            />
            <input
              className="rounded-lg border border-[#cddfd8] px-4 py-3 outline-none focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db] md:col-span-2"
              placeholder="Subject"
            />
            <textarea
              className="min-h-32 rounded-lg border border-[#cddfd8] px-4 py-3 outline-none focus:border-[#2f8a74] focus:ring-2 focus:ring-[#bfe8db] md:col-span-2"
              placeholder="Message"
            />
          </div>
          <button
            type="button"
            className="mt-5 rounded-lg bg-[#2f8a74] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#236a59]"
          >
            Submit Message
          </button>
        </form>
      </section>
    </div>
  </main>
);

export default ContactUsPage;
