import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Check,
  Star,
  Crown,
  Zap,
  Clock,
  TrendingUp,
  Eye,
  Phone,
  ChevronRight,
  Package,
  ArrowRight,
} from "lucide-react";
import { AdPackage } from "@shared/types";

export default function PackagesShowcase() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent multiple simultaneous fetch calls
  const fetchingRef = React.useRef(false);

  useEffect(() => {
    fetchPackages();

    // Set up periodic refresh every 60 seconds to catch admin updates
    const interval = setInterval(() => {
      if (!fetchingRef.current) {
        fetchPackages();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchPackages = async () => {
    if (fetchingRef.current) {
      return; // Already fetching, prevent duplicate calls
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      // Try the global API function first
      console.log("🔄 Attempting to fetch packages via global API...");

      let response;
      let data;

      try {
        // Check if global API is available
        if (typeof (window as any).api === "function") {
          response = await (window as any).api("/plans?isActive=true");
          data = response.ok ? response.json : response.data;
        } else {
          console.warn("⚠️ Global API not available, using direct fetch");
          throw new Error("Global API not available");
        }
      } catch (globalApiError: any) {
        console.warn(
          "⚠️ Global API failed, trying direct fetch:",
          globalApiError.message,
        );

        // Fallback to direct fetch if global API fails
        const directResponse = await fetch("/api/plans?isActive=true", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!directResponse.ok) {
          throw new Error(
            `HTTP ${directResponse.status}: ${directResponse.statusText}`,
          );
        }

        data = await directResponse.json();
        console.log("✅ Direct fetch successful");
      }

      if (data && data.success && Array.isArray(data.data)) {
        // Limit to 3 for showcase
        const showcasePackages = data.data.slice(0, 3);
        setPackages(showcasePackages);
        setError(null);
        console.log(
          "✅ Packages loaded successfully:",
          showcasePackages.length,
        );
      } else {
        console.warn("⚠️ Invalid packages data received:", data);
        setError("Invalid data format received");
        setPackages([]);
      }
    } catch (error: any) {
      console.error("❌ Error fetching packages:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
      });

      // Provide user-friendly error messages
      let errorMessage = "Failed to load packages";

      if (error.name === "NetworkError" || error.message.includes("fetch")) {
        errorMessage =
          "Network connection issue. Please check your internet connection.";
      } else if (error.name === "TimeoutError") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message.includes("HTTP")) {
        errorMessage = "Server error. Please try again later.";
      }

      setError(errorMessage);

      // Don't clear packages on error to avoid hiding the component completely
      if (packages.length === 0) {
        setPackages([]);
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case "basic":
        return <Eye className="h-6 w-6" />;
      case "featured":
        return <Star className="h-6 w-6" />;
      case "premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type) {
      case "basic":
        return "from-gray-100 to-gray-200 text-gray-800";
      case "featured":
        return "from-orange-100 to-orange-200 text-orange-800";
      case "premium":
        return "from-purple-100 to-purple-200 text-purple-800";
      default:
        return "from-gray-100 to-gray-200 text-gray-800";
    }
  };

  // Show loading state only on initial load
  if (loading && packages.length === 0) {
    return (
      <section className="bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no packages and there was an error
  if (packages.length === 0 && error) {
    return null;
  }

  // Don't render if no packages available
  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-[#C70000] mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              Advertisement Packages
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Boost your property visibility with our specially designed packages
            for Rohtak market. Get more views, inquiries, and faster sales.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {packages.map((pkg, index) => (
            <div
              key={pkg._id}
              data-testid="plan-card"
              className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                pkg.type === "featured"
                  ? "border-orange-300 transform scale-105 shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {/* Premium Badge */}
              {pkg.premium && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </div>
                </div>
              )}

              {/* Package Header */}
              <div
                className={`bg-gradient-to-r ${getPackageColor(pkg.type)} p-6 text-center`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-lg">
                  <div
                    className={`${pkg.type === "basic" ? "text-gray-600" : pkg.type === "featured" ? "text-orange-600" : "text-purple-600"}`}
                  >
                    {getPackageIcon(pkg.type)}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold mb-1">
                  {pkg.price === 0 ? "Free" : `₹${pkg.price}`}
                </div>
                <div className="text-sm opacity-75 flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {pkg.duration} days
                </div>
              </div>

              {/* Package Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">{pkg.description}</p>

                {/* Features (limited to 4 for showcase) */}
                <div className="space-y-3 mb-6">
                  {pkg.features.slice(0, 4).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {pkg.features.length > 4 && (
                    <div className="text-sm text-gray-500 italic">
                      + {pkg.features.length - 4} more features
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() =>
                    (window.location.href = `/checkout/${pkg._id}`)
                  }
                  className={`w-full ${
                    pkg.type === "basic"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : pkg.type === "featured"
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-purple-600 hover:bg-purple-700"
                  } text-white`}
                >
                  {pkg.price === 0
                    ? "Start Free Listing"
                    : `Choose for ₹${pkg.price}`}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">5x More Views</h3>
              <p className="text-white text-opacity-90">
                Featured listings get significantly more visibility
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">3x Faster Sales</h3>
              <p className="text-white text-opacity-90">
                Premium properties sell much faster than basic listings
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">4x More Calls</h3>
              <p className="text-white text-opacity-90">
                Get more genuine inquiries from interested buyers
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Sell Your Property Faster?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of successful sellers in Rohtak who trust our
            platform
          </p>
          <Button
            onClick={() => (window.location.href = "/post-property")}
            className="bg-[#C70000] hover:bg-[#A60000] text-white px-8 py-3 text-lg"
          >
            Post Your Property Now
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
