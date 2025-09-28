import React from "react";

interface FooterErrorBoundaryProps {
  children: React.ReactNode;
}

interface FooterErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorCount: number;
}

class FooterErrorBoundary extends React.Component<
  FooterErrorBoundaryProps,
  FooterErrorBoundaryState
> {
  private errorResetTimeout: NodeJS.Timeout | null = null;

  constructor(props: FooterErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<FooterErrorBoundaryState> {
    console.error("Footer Error Boundary caught an error:", error);

    return {
      hasError: true,
      errorMessage: error.message || "Unknown footer error",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Footer Error Details:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Increment error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    // Auto-reset after 30 seconds if error count is low
    if (this.state.errorCount < 3) {
      this.errorResetTimeout = setTimeout(() => {
        console.log("Auto-resetting footer error boundary");
        this.setState({
          hasError: false,
          errorMessage: "",
        });
      }, 30000);
    }
  }

  componentWillUnmount() {
    if (this.errorResetTimeout) {
      clearTimeout(this.errorResetTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-[#C70000] font-bold text-xl">AP</span>
                  </div>
                  <h3 className="text-2xl font-bold">Ashish Properties</h3>
                </div>

                <p className="text-red-100 text-sm leading-relaxed">
                  Your trusted property partner in Rohtak. Find your dream home
                  with verified listings and expert guidance.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span>📞</span>
                    <span>+91 9876543210</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>✉️</span>
                    <span>info@aashishproperty.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📍</span>
                    <span>Rohtak, Haryana, India</span>
                  </div>
                </div>
              </div>

              {/* Popular Locations */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Popular Locations</h4>
                <ul className="space-y-3">
                  {[
                    "Model Town",
                    "Sector 14",
                    "Civil Lines",
                    "Old City",
                    "Industrial Area",
                    "Bohar",
                  ].map((location) => (
                    <li key={location}>
                      <a
                        href={`/properties?location=${encodeURIComponent(location)}`}
                        className="text-red-200 hover:text-white transition-colors duration-200 text-sm flex items-center"
                      >
                        📍 Properties in {location}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Quick Links</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/buy"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Quick Buy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/sale"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Quick Sale
                    </a>
                  </li>
                  <li>
                    <a
                      href="/rent"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Rental Properties
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal & Support */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Legal & Support</h4>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="/about"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="/help"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Help Center
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-red-600 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2 text-sm">
                  <span>📅</span>
                  <span>
                    All rights reserved © 2006-{new Date().getFullYear()}{" "}
                    Aashish Properties
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-red-200">
                  {process.env.NODE_ENV === "development" && (
                    <>
                      <span className="text-yellow-300">
                        ⚠️ Fallback Footer
                      </span>
                      <span>Error #{this.state.errorCount}</span>
                    </>
                  )}
                  <span className="text-red-200">Fallback mode</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      );
    }

    return this.props.children;
  }
}

export default FooterErrorBoundary;
