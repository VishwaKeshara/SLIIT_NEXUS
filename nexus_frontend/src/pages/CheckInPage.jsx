import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { bookingApi } from "../services/api";

const CheckInPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [booking, setBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const doCheckIn = async () => {
      try {
        const response = await bookingApi.checkIn(id);
        setBooking(response.data);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(err?.response?.data?.message || "Invalid or already used check-in code.");
      } finally {
        setLoading(false);
      }
    };

    doCheckIn();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 font-bold text-slate-600 font-outfit uppercase tracking-widest text-sm">Validating Check-in...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-[3rem] bg-white p-8 shadow-xl text-center">
        {status === "success" ? (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Check-in Successful!</h1>
            <p className="mt-4 text-slate-500">Welcome to the venue. Your reservation has been verified.</p>
            
            <div className="mt-8 rounded-3xl bg-slate-50 p-6 text-left">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Resource</p>
              <p className="text-lg font-bold text-slate-900">{booking?.resourceName}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Date</p>
                  <p className="font-bold text-slate-700">{booking?.date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Check-in Time</p>
                  <p className="font-bold text-slate-700">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900">Check-in Failed</h1>
            <p className="mt-4 text-slate-500">{errorMsg}</p>
          </div>
        )}

        <Link
          to="/"
          className="mt-8 inline-block w-full rounded-[1.5rem] bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default CheckInPage;
