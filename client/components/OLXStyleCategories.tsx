import React, { useState, useEffect } from "react";
import {
  Car,
  Building2,
  Smartphone,
  Briefcase,
  Shirt,
  Bike,
  Tv,
  Truck,
  Sofa,
  Heart,
  Plus,
} from "lucide-react";
import { withApiErrorBoundary } from "./ApiErrorBoundary";
import { useNavigate } from "react-router-dom";

const categoryIcons: Record<string, any> = {
  Cars: Car,
  Properties: Building2,
  Mobiles: Smartphone,
  Jobs: Briefcase,
  Fashion: Shirt,
  Bikes: Bike,
  "Electronics & Appliances": Tv,
  "Commercial Vehicles & Spares": Truck,
  Furniture: Sofa,
  Pets: Heart,
};

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: any[];
  order: number;
  active: boolean;
}

interface HomepageSlider {
  _id: string;
  title: string;
  subtitle: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  order: number;
}

function OLXStyleCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<HomepageSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [activeSubcats, setActiveSubcats] = useState<any[]>([]);
  const navigate = useNavigate();

  // Default categories similar to OLX
  const defaultCategories = [
    { name: "Cars", slug: "cars", icon: "🚗" },
    { name: "Properties", slug: "properties", icon: "🏢" },
    { name: "Mobiles", slug: "mobiles", icon: "📱" },
    { name: "Jobs", slug: "jobs", icon: "💼" },
    { name: "Fashion", slug: "fashion", icon: "👕" },
    { name: "Other Services", slug: "other-services", icon: "🛠️" },
    { name: "Bikes", slug: "bikes", icon: "🏍️" },
    { name: "Electronics & Appliances", slug: "electronics", icon: "📺" },
    { name: "Commercial Vehicles & Spares", slug: "commercial", icon: "🚚" },
    { name: "Furniture", slug: "furniture", icon: "🛋️" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Set default/empty data immediately to prevent UI blocking
    setSliders([]); // No sliders needed since we removed Rohtak section

    // Use default categories immediately to prevent empty UI
    console.log("📂 Loading default categories first...");
    setCategories(defaultCategories as any);

    try {
      // Try simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        console.log("🔄 Fetching categories with timeout via global API...");
        const apiRes = await (window as any).api("/categories?active=true");
        clearTimeout(timeoutId);

        if (
          apiRes &&
          apiRes.ok &&
          apiRes.json?.success &&
          Array.isArray(apiRes.json.data) &&
          apiRes.json.data.length > 0
        ) {
          console.log(
            "✅ Categories loaded successfully, replacing defaults:",
            apiRes.json.data.length,
          );
          setCategories(apiRes.json.data.slice(0, 10));
          return; // Success
        }

        console.log("⚠️ Categories API not OK or empty; keeping defaults");
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (
          fetchError?.name === "TimeoutError" ||
          fetchError?.name === "AbortError"
        ) {
          console.warn(
            "⏰ Categories request timeout - keeping default categories",
          );
        } else {
          console.warn(
            "⚠️ Categories request failed:",
            fetchError?.message || fetchError,
            "- keeping defaults",
          );
        }
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category: Category) => {
    try {
      const slug = (category.slug || "").toLowerCase();
      const name = (category.name || "").toLowerCase();

      // Other Services -> dedicated flow
      if (slug === "other-services" || /other\s*services?/.test(name)) {
        navigate("/other-services");
        return;
      }

      // Property categories -> dedicated pages that fetch admin subcategories
      const propertyPages = new Set(["buy", "sale", "rent", "lease", "pg"]);
      if (propertyPages.has(slug)) {
        navigate(`/${slug}`);
        return;
      }

      // Fallback: generic category page
      navigate(`/categories/${slug || name.replace(/[^a-z0-9]+/g, "-")}`);
    } catch (e) {
      console.warn("Category navigation failed:", (e as any)?.message || e);
    }
  };

  const handleSellClick = () => {
    window.location.href = "/post-property";
  };

  if (loading) {
    return (
      <div className="bg-white">
        {/* Banner placeholder */}
        <div className="mx-4 mt-4 mb-6">
          <div className="bg-blue-100 rounded-lg h-20 animate-pulse"></div>
        </div>

        {/* Categories grid placeholder */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Dynamic Slider Section - Only render if sliders exist */}
      {sliders.length > 0 && (
        <div className="mx-4 mt-4 mb-6">
          <div className="space-y-3">
            {sliders.map((slider) => (
              <div
                key={slider._id}
                className={`bg-gradient-to-r ${slider.backgroundColor} rounded-lg p-4 ${slider.textColor} relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{slider.title}</h3>
                    <p className="text-sm opacity-90">{slider.subtitle}</p>
                  </div>
                  <div className="text-3xl">{slider.icon}</div>
                </div>
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
                <div className="absolute -right-6 -bottom-2 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-5 gap-3">
          {(categories || []).slice(0, 10).map((category, index) => {
            if (!category || !category.name) return null;

            const IconComponent = categoryIcons[category.name] || Building2;
            const isActive = activeCat?.slug === category.slug;

            return (
              <div
                key={category._id || category.slug || index}
                data-testid="header-cat-chip"
                onClick={() => handleCategoryClick(category)}
                className={`flex flex-col items-center cursor-pointer active:scale-95 transition-transform ${isActive ? "opacity-100" : "opacity-90"}`}
              >
                <div
                  className={`w-14 h-14 ${isActive ? "bg-red-100" : "bg-red-50"} border border-red-100 rounded-lg flex items-center justify-center mb-2 hover:bg-red-100 transition-colors`}
                >
                  <IconComponent className="h-7 w-7 text-[#C70000]" />
                </div>
                <span className="text-xs text-gray-800 text-center font-medium leading-tight">
                  {category.name && category.name.length > 12
                    ? `${category.name.substring(0, 12)}...`
                    : category.name || "Category"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subcategories panel (admin-fed) */}
      {activeCat && (
        <div className="px-4 pb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {activeCat.name} Subcategories
              </h3>
              <button
                className="text-sm text-[#C70000] hover:underline"
                onClick={() =>
                  (window.location.href = `/categories/${activeCat.slug}`)
                }
              >
                View All
              </button>
            </div>

            {activeSubcats.length === 0 ? (
              <div className="text-sm text-gray-500">
                No subcategories found
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeSubcats.map((sub: any) => (
                  <a
                    key={sub._id || sub.slug}
                    href={`/categories/${activeCat.slug}/${sub.slug}`}
                    className="block group border border-gray-200 rounded-md p-3 hover:border-red-300 hover:shadow-sm transition"
                  >
                    <div className="text-gray-900 text-sm font-medium group-hover:text-[#C70000] truncate">
                      {sub.name || sub.title || sub.slug}
                    </div>
                    {sub.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {sub.description}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export with API error boundary for better error handling
export default withApiErrorBoundary(OLXStyleCategories);
