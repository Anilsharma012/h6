import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import useEmblaCarousel from "embla-carousel-react";

interface Banner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

interface Project {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  images?: string[];
  imageUrl?: string;
  location?: string;
  price?: number;
  priceRange?: string;
  status?: string;
  isActive?: boolean;
}

export default function NewProjects() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/new-projects/banners", { cache: "no-store" });
      const data = await res.json();
      if (data && data.success) {
        const active = (data.data || []).filter((b: any) => b.isActive);
        setBanners(active);
      }
    } catch (e) {
      console.warn("Failed to load new project banners:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/new-projects?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setProjects(data.data);
      } else {
        setProjects([]);
      }
    } catch (e) {
      console.warn("Failed to load new projects:", e);
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchProjects();

    const onUpdate = () => {
      fetchBanners();
      fetchProjects();
    };

    window.addEventListener("newProjectsUpdated", onUpdate);

    // Poll as fallback every 15s when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchBanners();
        fetchProjects();
      }
    }, 15000);

    return () => {
      window.removeEventListener("newProjectsUpdated", onUpdate);
      clearInterval(interval);
    };
  }, [fetchBanners]);

  useEffect(() => {
    // Re-init embla when banners change
    if (emblaApi) {
      try { emblaApi.reInit(); } catch (e) {}
    }
  }, [banners, emblaApi]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading new projects...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">New Projects</h1>

        {banners.length > 0 ? (
          <div className="embla overflow-hidden rounded-lg">
            <div className="embla__viewport w-full" ref={emblaRef}>
              <div className="embla__container flex w-full">
                {banners.map((b) => (
                  <div key={b._id} className="embla__slide min-w-full basis-full">
                    <a href={b.link} className="block w-full">
                      <div className="relative w-full h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute left-4 bottom-4 bg-black bg-opacity-40 text-white p-3 rounded">
                          <h3 className="text-lg font-semibold">{b.title}</h3>
                          {b.subtitle && <p className="text-sm">{b.subtitle}</p>}
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">No banners to display.</div>
        )}

        <section className="mt-8">
          {projects.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {projects.map((p) => (
                <a
                  key={p._id || p.slug}
                  href={`/new-projects/${p.slug}`}
                  className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    <img
                      src={p.images?.[0] || p.imageUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-sm text-gray-500 mb-1">{p.location}</div>
                    <div className="font-semibold text-gray-900 line-clamp-2">{p.name}</div>
                    {(p.priceRange || p.price) && (
                      <div className="text-[#C70000] text-sm mt-1">{p.priceRange || `₹${p.price}`}</div>
                    )}
                    {p.status && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">{p.status}</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-gray-700">Explore upcoming and ongoing projects below.</div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
