import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { captureReferralFromParams } from "../lib/referral";

export default function Layout() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    captureReferralFromParams(searchParams);
  }, [searchParams]);

  return (
    <div className="relative min-h-screen flex flex-col text-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
