import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  Calendar,
  Users,
  Building,
} from "lucide-react";
import { getAllRohtakLocations } from "../data/rohtakLocations";

interface FooterPage {
  _id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  order?: number;
  isExternal?: boolean;
  url?: string;
  createdAt: string;
}

interface FooterLink {
  _id: string;
  title: string;
  url: string;
  section: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
}

interface FooterSettings {
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  showLocations: boolean;
  locations: string[];
}

export default function Footer() {
  const [footerPages, setFooterPages] = useState<FooterPage[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    companyName: "POSTTRR",
    companyDescription:
      "Share your unique properties, boost your sales online and connect with verified buyers. It's a community where your control is a priority.",
    companyLogo: "P",
    socialLinks: {},
    contactInfo: {},
    showLocations: true,
    locations: getAllRohtakLocations().slice(0, 15), // Show first 15 locations
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Initialize with fallback data
  const initializeFallbackData = () => {
    // Set fallback footer settings if nothing is loaded
    if (
      !footerSettings.companyName ||
      footerSettings.companyName === "POSTTRR"
    ) {
      setFooterSettings((prev) => ({
        ...prev,
        companyName: "POSTTRR",
        companyDescription:
          "Share your unique properties, boost your sales online and connect with verified buyers. It's a community where your comfort is a priority.",
        companyLogo: "P",
        socialLinks: {
          facebook: "https://facebook.com/posttrr",
          twitter: "https://twitter.com/posttrr",
          instagram: "https://instagram.com/posttrr",
          youtube: "https://youtube.com/posttrr",
        },
        contactInfo: {
          phone: "+91 98765 43210",
          email: "info@posttrr.com",
          address: "Mumbai, Maharashtra, India",
        },
        showLocations: true,
        locations: getAllRohtakLocations().slice(0, 12), // Show first 12 locations as fallback
      }));
    }

    // Only set fallback links if NO links are loaded from database
    // This prevents duplicates when admin creates links
    if (footerLinks.length === 0) {
      setFooterLinks([
        {
          _id: "fallback-1",
          title: "About Us",
          url: "/about-us",
          section: "quick_links",
          order: 1,
          isActive: true,
          isExternal: false,
        },
        {
          _id: "fallback-2",
          title: "Contact Us",
          url: "/contact-us",
          section: "quick_links",
          order: 2,
          isActive: true,
          isExternal: false,
        },
        {
          _id: "fallback-3",
          title: "Privacy Policy",
          url: "/privacy-policy",
          section: "legal",
          order: 1,
          isActive: true,
          isExternal: false,
        },
        {
          _id: "fallback-4",
          title: "Terms & Conditions",
          url: "/terms-conditions",
          section: "legal",
          order: 2,
          isActive: true,
          isExternal: false,
        },
      ]);
    }
  };

  useEffect(() => {
    // Wrap everything in error protection
    try {
      // Initialize fallback data first
      initializeFallbackData();

      // Then try to fetch real data with error protection
      fetchFooterData().catch((error) => {
        console.warn(
          "🚨 useEffect fetchFooterData failed:",
          error?.message || "Unknown error",
        );
        // Ensure loading state is cleared even if fetch fails
        try {
          setLoading(false);
        } catch (e) {
          console.warn("❌ Error clearing loading state:", e?.message);
        }
      });
    } catch (effectError) {
      console.warn(
        "💥 useEffect initialization error:",
        effectError?.message || "Unknown effect error",
      );
      try {
        setLoading(false);
      } catch (e) {
        console.warn("❌ Error clearing loading state in catch:", e?.message);
      }
    }

    // Auto-refresh footer data every 10 minutes to pick up admin changes (reduced frequency)
    const interval = setInterval(
      () => {
        try {
          // Only auto-refresh if online and document is visible
          if (navigator.onLine && !document.hidden) {
            fetchFooterData().catch((error) => {
              console.warn("🚨 Interval fetch failed:", error?.message);
            });
          }
        } catch (intervalError) {
          console.warn("❌ Interval callback error:", intervalError?.message);
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes

    // Listen for custom refresh events from admin panel
    const handleFooterRefresh = () => {
      try {
        console.log("🔄 Footer refresh triggered by admin");
        fetchFooterData().catch((error) => {
          console.warn("🚨 Admin refresh fetch failed:", error?.message);
        });
      } catch (refreshError) {
        console.warn("❌ Footer refresh handler error:", refreshError?.message);
      }
    };

    // Handle page published events
    const handlePagePublished = (event: any) => {
      try {
        console.log("📄 Page published event received:", event.detail);
        fetchFooterData().catch((error) => {
          console.warn("🚨 Page published fetch failed:", error?.message);
        });
      } catch (error) {
        console.warn("❌ Page published handler error:", error?.message);
      }
    };

    // Handle page unpublished events
    const handlePageUnpublished = (event: any) => {
      try {
        console.log("📄 Page unpublished event received:", event.detail);
        fetchFooterData().catch((error) => {
          console.warn("🚨 Page unpublished fetch failed:", error?.message);
        });
      } catch (error) {
        console.warn("❌ Page unpublished handler error:", error?.message);
      }
    };

    // Listen for online/offline events
    const handleOnline = () => {
      try {
        console.log("🌐 Connection restored, refreshing footer data");
        fetchFooterData().catch((error) => {
          console.warn("🚨 Online fetch failed:", error?.message);
        });
      } catch (onlineError) {
        console.warn("❌ Online handler error:", onlineError?.message);
      }
    };

    const handleOffline = () => {
      try {
        console.log("📴 Connection lost, footer will use cached data");
      } catch (offlineError) {
        console.warn("❌ Offline handler error:", offlineError?.message);
      }
    };

    // Listen for visibility change to refresh when page becomes visible
    const handleVisibilityChange = () => {
      try {
        if (!document.hidden && navigator.onLine) {
          console.log("👁️ Page became visible, refreshing footer data");
          fetchFooterData().catch((error) => {
            console.warn("🚨 Visibility change fetch failed:", error?.message);
          });
        }
      } catch (visibilityError) {
        console.warn(
          "❌ Visibility change handler error:",
          visibilityError?.message,
        );
      }
    };

    try {
      window.addEventListener("footerRefresh", handleFooterRefresh);
      window.addEventListener("footerUpdate", handleFooterRefresh);
      window.addEventListener("pagePublished", handlePagePublished);
      window.addEventListener("pageUnpublished", handlePageUnpublished);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    } catch (listenerError) {
      console.warn("❌ Error adding event listeners:", listenerError?.message);
    }

    return () => {
      try {
        clearInterval(interval);
        window.removeEventListener("footerRefresh", handleFooterRefresh);
        window.removeEventListener("footerUpdate", handleFooterRefresh);
        window.removeEventListener("pagePublished", handlePagePublished);
        window.removeEventListener("pageUnpublished", handlePageUnpublished);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      } catch (cleanupError) {
        console.warn(
          "❌ Error cleaning up event listeners:",
          cleanupError?.message,
        );
      }
    };
  }, []);

  const fetchFooterData = async (isDelayed = false) => {
    // If this is a delayed fetch and we already have data, skip it
    if (isDelayed && footerLinks.length > 0 && footerSettings.companyName) {
      console.log("📋 Skipping delayed fetch - data already loaded");
      return;
    }

    // Wrap everything in a try-catch to prevent any errors from escaping
    try {
      setLoading(true);
      console.log("🔄 Starting bulletproof footer data fetch...");

      // Ultra-safe fetch with multiple layers of error protection
      const bulletproofFetch = async (
        url: string,
        name: string,
      ): Promise<any> => {
        return new Promise<any>(async (resolve) => {
          try {
            // Check if fetch is even available
            if (!window.fetch) {
              console.warn(`❌ ${name}: fetch not available`);
              resolve(null as any);
              return;
            }

            // Create abort controller with timeout
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => {
              try {
                if (!controller.signal.aborted) controller.abort("timeout");
              } catch {
                // Ignore abort errors
              }
            }, 3000); // 3 seconds

            try {
              const response = await fetch(url, {
                signal: controller.signal,
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              });

              clearTimeout(timeoutId);

              if (response && response.ok) {
                try {
                  const data = await response.json();
                  console.log(`✅ ${name} loaded successfully`);
                  resolve(data as any);
                } catch (jsonError: any) {
                  console.warn(
                    `❌ ${name} JSON parse failed:`,
                    jsonError?.message || "Unknown JSON error",
                  );
                  resolve(null as any);
                }
              } else {
                console.warn(
                  `⚠️ ${name} HTTP error: ${response?.status || "Unknown status"}`,
                );
                resolve(null as any);
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);

              if (
                controller.signal.aborted ||
                fetchError?.name === "AbortError"
              ) {
                console.warn(`⏱️ ${name} fetch aborted (timeout)`);
              } else if (
                fetchError?.name === "TypeError" &&
                (fetchError?.message?.includes("fetch") ||
                  fetchError?.message?.includes("Network"))
              ) {
                console.warn(
                  `🌐 ${name} network error: ${fetchError?.message || "Network unavailable"}`,
                );
              } else {
                console.warn(
                  `❌ ${name} fetch error: ${fetchError?.message || "Unknown fetch error"}`,
                );
              }
              resolve(null as any);
            }
          } catch (unexpectedError) {
            console.warn(
              `💥 ${name} unexpected error: ${unexpectedError?.message || "Unknown error"}`,
            );
            resolve(null as any);
          }
        });
      };

      // Only try API calls if online and environment seems stable
      if (navigator.onLine && !document.hidden) {
        try {
          // Try consolidated settings first
          const siteSettings = await bulletproofFetch(
            "/api/settings",
            "Site settings",
          );
          if (siteSettings && siteSettings.success && siteSettings.data) {
            try {
              const footer = siteSettings.data.footer || {};
              setFooterSettings((prev) => ({ ...prev, ...footer }));
              setLastUpdated(
                siteSettings.data.updatedAt || new Date().toISOString(),
              );
            } catch (stateError) {
              console.warn(
                "❌ Error applying site settings:",
                stateError?.message,
              );
            }
          }

          // Attempt to fetch footer settings with bulletproof protection
          const settingsData = await bulletproofFetch(
            "/api/footer/settings",
            "Footer settings",
          );
          if (settingsData && settingsData.success && settingsData.data) {
            try {
              setFooterSettings((prev) => ({ ...prev, ...settingsData.data }));
              setLastUpdated(
                settingsData.data.updatedAt || new Date().toISOString(),
              );
            } catch (stateError) {
              console.warn(
                "❌ Error updating footer settings state:",
                stateError?.message,
              );
            }
          }

          // Attempt to fetch footer links with bulletproof protection
          const linksData = await bulletproofFetch(
            "/api/footer/links",
            "Footer links",
          );
          if (
            linksData &&
            linksData.success &&
            linksData.data &&
            Array.isArray(linksData.data)
          ) {
            try {
              // Replace fallback links with real data to prevent duplicates
              setFooterLinks(linksData.data);
            } catch (stateError) {
              console.warn(
                "❌ Error updating footer links state:",
                stateError?.message,
              );
            }
          }

          // Attempt to fetch pages with bulletproof protection
          const pagesData = await bulletproofFetch(
            "/api/content/pages",
            "Footer pages",
          );
          if (
            pagesData &&
            pagesData.success &&
            pagesData.data &&
            Array.isArray(pagesData.data)
          ) {
            try {
              setFooterPages(pagesData.data);
            } catch (stateError) {
              console.warn(
                "❌ Error updating footer pages state:",
                stateError?.message,
              );
            }
          }
        } catch (apiError) {
          console.warn(
            "❌ API calls failed:",
            apiError?.message || "Unknown API error",
          );
        }
      } else {
        console.log("📴 Skipping API calls - offline or page hidden");
      }

      console.log("🏁 Bulletproof footer data fetch completed");
    } catch (outerError) {
      console.warn(
        "💥 Outer error in fetchFooterData:",
        outerError?.message || "Unknown outer error",
      );
      // Continue with fallback data - absolutely nothing should break the footer
    } finally {
      try {
        setLoading(false);
      } catch (finalError) {
        console.warn("❌ Error setting loading state:", finalError?.message);
      }
    }
  };

  // Organize pages by type and remove duplicates
  const getPagesByType = (type: string) => {
    return footerPages
      .filter((page) => page.type === type && page.status === "published")
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getLinksBySection = (section: string) => {
    return footerLinks
      .filter((link) => link.section === section && link.isActive)
      .sort((a, b) => a.order - b.order);
  };

  // Get unique quick links - avoid duplicates by checking slug/url
  const getAllQuickLinks = () => {
    const policyPages = getPagesByType("policy");
    const pagePages = getPagesByType("page");
    const allPages = [...policyPages, ...pagePages];

    // Remove duplicates based on slug or url
    const uniquePages = allPages.filter(
      (page, index, self) =>
        index ===
        self.findIndex((p) => p.slug === page.slug || p.url === page.url),
    );

    return uniquePages.slice(0, 6);
  };

  // Get unique legal pages - avoid duplicates
  const getAllLegalPages = () => {
    const termsPages = getPagesByType("terms");
    const faqPages = getPagesByType("faq");
    const legalTypePages = getPagesByType("legal");
    const allPages = [...termsPages, ...faqPages, ...legalTypePages];

    // Remove duplicates based on slug or url
    const uniquePages = allPages.filter(
      (page, index, self) =>
        index ===
        self.findIndex((p) => p.slug === page.slug || p.url === page.url),
    );

    return uniquePages.slice(0, 6);
  };

  const quickLinks = getAllQuickLinks();
  const legalPages = getAllLegalPages();

  if (loading) {
    return (
      <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-pulse">Loading footer...</div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-full w-2 h-2 animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "3s",
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[#C70000] font-bold text-xl">
                  {footerSettings.companyLogo}
                </span>
              </div>
              <h3 className="text-2xl font-bold">
                {footerSettings.companyName}
              </h3>
            </div>

            <p className="text-red-100 text-sm leading-relaxed">
              {footerSettings.companyDescription}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {footerSettings.socialLinks?.facebook && (
                <a
                  href={footerSettings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.twitter && (
                <a
                  href={footerSettings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.instagram && (
                <a
                  href={footerSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.youtube && (
                <a
                  href={footerSettings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Contact Info */}
            {(footerSettings.contactInfo?.phone ||
              footerSettings.contactInfo?.email) && (
              <div className="space-y-2 text-sm">
                {footerSettings.contactInfo?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{footerSettings.contactInfo.phone}</span>
                  </div>
                )}
                {footerSettings.contactInfo?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{footerSettings.contactInfo.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Locations */}
          {footerSettings.showLocations && footerSettings.locations && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <h3 className="text-lg font-semibold">POPULAR LOCATIONS</h3>
              </div>
              <ul className="space-y-3">
                {footerSettings.locations?.map((location) => (
                  <li key={location}>
                    <Link
                      to={`/properties?location=${location.toLowerCase()}`}
                      className="text-red-100 hover:text-white transition-all duration-300 text-sm flex items-center space-x-2 group"
                    >
                      <span className="w-2 h-2 bg-red-300 rounded-full group-hover:bg-white transition-colors"></span>
                      <span>{location}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Links - Combined Admin Links and Pages */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <h3 className="text-lg font-semibold">QUICK LINKS</h3>
            </div>
            <ul className="space-y-3">
              {/* Dynamic footer links from admin panel */}
              {getLinksBySection("quick_links").map((link) => (
                <li key={`link-${link._id}`}>
                  <Link
                    to={link.url}
                    className="text-red-100 hover:text-white transition-all duration-300 text-sm flex items-center space-x-2 group"
                    target={link.isExternal ? "_blank" : "_self"}
                    rel={link.isExternal ? "noopener noreferrer" : ""}
                  >
                    <span className="w-2 h-2 bg-red-300 rounded-full group-hover:bg-white transition-colors"></span>
                    <span>{link.title}</span>
                    {link.isExternal && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}

              {/* Dynamic admin-created pages (only if not already covered by links) */}
              {quickLinks
                .filter((page) => {
                  // Only show pages that don't conflict with existing links
                  const existingLinks = getLinksBySection("quick_links");
                  return !existingLinks.some(
                    (link) =>
                      link.url === (page.url || `/${page.slug}`) ||
                      link.title.toLowerCase() === page.title.toLowerCase(),
                  );
                })
                .map((page) => (
                  <li key={`page-${page._id}`}>
                    <Link
                      to={page.url || `/${page.slug}`}
                      className="text-red-100 hover:text-white transition-all duration-300 text-sm flex items-center space-x-2 group"
                      target={page.isExternal ? "_blank" : "_self"}
                      rel={page.isExternal ? "noopener noreferrer" : ""}
                    >
                      <span className="w-2 h-2 bg-red-300 rounded-full group-hover:bg-white transition-colors"></span>
                      <span>{page.title}</span>
                      {page.isExternal && <ExternalLink className="h-3 w-3" />}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">LEGAL & SUPPORT</h3>
            </div>
            <ul className="space-y-3">
              {/* Dynamic legal links from admin panel */}
              {getLinksBySection("legal").map((link) => (
                <li key={`legal-link-${link._id}`}>
                  <Link
                    to={link.url}
                    className="text-red-100 hover:text-white transition-all duration-300 text-sm flex items-center space-x-2 group"
                    target={link.isExternal ? "_blank" : "_self"}
                    rel={link.isExternal ? "noopener noreferrer" : ""}
                  >
                    <span className="w-2 h-2 bg-red-300 rounded-full group-hover:bg-white transition-colors"></span>
                    <span>{link.title}</span>
                    {link.isExternal && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}

              {/* Dynamic legal pages (only if not already covered by links) */}
              {legalPages
                .filter((page) => {
                  // Only show pages that don't conflict with existing legal links
                  const existingLegalLinks = getLinksBySection("legal");
                  return !existingLegalLinks.some(
                    (link) =>
                      link.url === (page.url || `/${page.slug}`) ||
                      link.title.toLowerCase() === page.title.toLowerCase(),
                  );
                })
                .map((page) => (
                  <li key={`legal-page-${page._id}`}>
                    <Link
                      to={page.url || `/${page.slug}`}
                      className="text-red-100 hover:text-white transition-all duration-300 text-sm flex items-center space-x-2 group"
                      target={page.isExternal ? "_blank" : "_self"}
                      rel={page.isExternal ? "noopener noreferrer" : ""}
                    >
                      <span className="w-2 h-2 bg-red-300 rounded-full group-hover:bg-white transition-colors"></span>
                      <span>{page.title}</span>
                      {page.isExternal && <ExternalLink className="h-3 w-3" />}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-red-400/30">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-red-100 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                All rights reserved © 2006-{new Date().getFullYear()}{" "}
                {footerSettings.companyName}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link
                to="/sitemap"
                className="text-red-100 hover:text-white transition-colors"
              >
                Sitemap
              </Link>
              <Link
                to="/support/help"
                className="text-red-100 hover:text-white transition-colors"
              >
                Help Center
              </Link>
              <span className="text-red-200">
                {footerPages.length > 0 &&
                  `${footerPages.length} pages available`}
              </span>
            </div>
          </div>

          {/* Admin Info (visible to admins) */}
          <div className="mt-4 text-center">
            <p className="text-xs text-red-200/70">
              Footer content managed dynamically • Last updated:{" "}
              {lastUpdated
                ? new Date(lastUpdated).toLocaleString()
                : new Date().toLocaleDateString()}
            </p>
            {/* Debug info - remove in production */}
            <div className="text-xs text-red-200/50 mt-2 space-y-2">
              <div>
                Debug: Links: {footerLinks.length} | Pages: {footerPages.length}{" "}
                | Company: {footerSettings.companyName || "Not loaded"} |
                Social: {Object.keys(footerSettings.socialLinks || {}).length}
              </div>
              <div>
                Status: {navigator.onLine ? "🌐 Online" : "📴 Offline"} | Page:{" "}
                {document.hidden ? "👁️‍🗨️ Hidden" : "👁️ Visible"} | Updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleTimeString()
                  : "Never"}
              </div>
              <button
                onClick={() => {
                  try {
                    console.log("🔄 Manual footer refresh triggered");
                    fetchFooterData().catch((error) => {
                      console.warn("🚨 Manual refresh failed:", error?.message);
                    });
                  } catch (buttonError) {
                    console.warn(
                      "❌ Manual refresh button error:",
                      buttonError?.message,
                    );
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                disabled={!navigator.onLine}
              >
                {navigator.onLine
                  ? "Force Refresh Footer"
                  : "Offline - Can't Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
