import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Clock, Package, Shield } from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import DynamicFooter from "../components/DynamicFooter";

interface AdPackage {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  type: "basic" | "featured" | "premium" | string;
  features: string[];
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<AdPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Prefer server package-by-id endpoint
        const res = await fetch(`/api/packages/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        const item: AdPackage | undefined = data?.data;
        if (!item) throw new Error("Package not found");
        setPkg(item);
        document.title = `${item.name} | Ashish Properties`;
      } catch (e: any) {
        setError(e.message || "Failed to load package");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse h-8 w-64 bg-gray-200 rounded mb-4" />
          <div className="animate-pulse h-4 w-96 bg-gray-200 rounded" />
        </div>
        <BottomNavigation />
        <DynamicFooter />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link to="/advertise" className="inline-flex items-center text-[#C70000] mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Packages
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || "Package not found"}
          </div>
        </div>
        <BottomNavigation />
        <DynamicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to="/advertise" className="inline-flex items-center text-[#C70000] mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Packages
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] text-white p-6">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6" />
                <h1 className="text-2xl font-bold">{pkg.name}</h1>
              </div>
              <p className="opacity-90 mt-2">{pkg.description}</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded border">
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="text-2xl font-bold">
                    {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded border">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="text-2xl font-bold">{pkg.duration} days</div>
                </div>
                <div className="p-4 bg-gray-50 rounded border">
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="text-2xl font-bold capitalize">{pkg.type}</div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">What you get</h2>
                <ul className="space-y-2">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 flex items-start">
                <Shield className="h-5 w-5 mr-2 mt-0.5" />
                <p className="text-sm">
                  Secure checkout and online payment are coming soon. For now, please
                  contact our team after selecting a package. We'll activate it for your account quickly.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <a href={`/post-property?plan=${pkg._id}`} className="inline-flex items-center px-6 py-3 bg-[#C70000] hover:bg-[#A60000] text-white rounded-md font-semibold">
                  Continue • Post Property
                </a>
                <a href="/contact-us" className="px-6 py-3 border rounded-md font-semibold">Contact Support</a>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" /> Activation typically within 30 minutes during business hours.
          </div>
        </div>
      </main>
      <BottomNavigation />
      <DynamicFooter />
    </div>
  );
}
