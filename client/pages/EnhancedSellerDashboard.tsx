import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Bell,
  Home,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Settings,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Star,
  CreditCard,
  Package,
  Download,
  AlertCircle,
  MoreHorizontal,
  DollarSign,
  Users,
  Activity,
  Crown,
  Shield,
  Zap,
  Search,
  Filter,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "approval" | "rejection" | "account" | "general";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface Message {
  _id: string;
  buyerName: string;
  buyerEmail: string;
  message: string;
  propertyId: string;
  propertyTitle: string;
  timestamp: string;
  isRead: boolean;
}

interface Package {
  _id: string;
  name: string;
  price: number;
  features: string[];
  duration: number; // days
  type: "basic" | "premium" | "elite";
}

interface Payment {
  _id: string;
  amount: number;
  package: string;
  status: "completed" | "pending" | "failed";
  date: string;
  transactionId: string;
}

export default function EnhancedSellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    pushNotifications: true,
  });

  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    profileViews: 0,
    premiumListings: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    if (user.userType !== "seller") {
      navigate("/user-dashboard");
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth", { replace: true });
        return;
      }

      // Fetch all data in parallel
      const [
        propertiesRes,
        notificationsRes,
        messagesRes,
        packagesRes,
        paymentsRes,
      ] = await Promise.all([
        api.get("/seller/properties", token),
        api.get("/seller/notifications", token),
        api.get("/seller/messages", token),
        api.get("/seller/packages", token),
        api.get("/seller/payments", token),
      ]);

      // Handle properties
      if (propertiesRes && propertiesRes.data && propertiesRes.data.success) {
        setProperties(propertiesRes.data.data);
        calculateStats(propertiesRes.data.data);
      }

      // Handle notifications
      if (
        notificationsRes &&
        notificationsRes.data &&
        notificationsRes.data.success
      ) {
        setNotifications(notificationsRes.data.data);
      }

      // Handle messages
      if (messagesRes && messagesRes.data && messagesRes.data.success) {
        setMessages(messagesRes.data.data);
      }

      // Handle packages
      if (packagesRes && packagesRes.data && packagesRes.data.success) {
        setPackages(packagesRes.data.data);
      }

      // Handle payments
      if (paymentsRes && paymentsRes.data && paymentsRes.data.success) {
        setPayments(paymentsRes.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (properties: Property[]) => {
    const totalViews = properties.reduce((sum, prop) => sum + prop.views, 0);
    const totalInquiries = properties.reduce(
      (sum, prop) => sum + prop.inquiries,
      0,
    );
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const unreadMessages = messages.filter((m) => !m.isRead).length;

    setStats({
      totalProperties: properties.length,
      pendingApproval: properties.filter((p) => p.approvalStatus === "pending")
        .length,
      approved: properties.filter((p) => p.approvalStatus === "approved")
        .length,
      rejected: properties.filter((p) => p.approvalStatus === "rejected")
        .length,
      totalViews,
      totalInquiries,
      unreadNotifications,
      unreadMessages,
      profileViews: 0,
      premiumListings: properties.filter((p) => p.isPremium).length,
    });
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(`/seller/notifications/${notificationId}/read`, {}, token);
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/seller/notifications/${notificationId}`, token);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        emailNotifications: profileData.emailNotifications,
        pushNotifications: profileData.pushNotifications,
      };

      await api.put("/seller/profile", updateData, token);
      setError("");
      // Show success message
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    }
  };

  const changePassword = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.put(
        "/seller/change-password",
        {
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        },
        token,
      );

      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      // Show success message
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Failed to change password");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejection":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "account":
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Seller Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("notifications")}
              >
                <Bell className="h-4 w-4" />
                {stats.unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 text-white">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </Button>
            </div>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card key="stats-properties">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card key="stats-pending">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingApproval}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-approved">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-views">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalViews}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-messages">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.unreadMessages}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-profile-views">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profile Views
              </CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.profileViews}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-premium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.premiumListings}
              </div>
            </CardContent>
          </Card>

          <Card key="stats-inquiries">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalInquiries}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {stats.unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white">
                  {stats.unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              Messages
              {stats.unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/post-property">
                    <Button className="w-full bg-[#C70000] hover:bg-[#A60000] text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Property
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("properties")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Manage Properties
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("messages")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages ({stats.unreadMessages})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("payments")}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Properties */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Properties</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("properties")}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">
                      You haven't posted any properties yet
                    </p>
                    <Link to="/post-property">
                      <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Property
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.slice(0, 3).map((property, idx) => (
                      <div
                        key={
                          (property as any)._id ||
                          (property as any).id ||
                          property.title ||
                          idx
                        }
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {property.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              <MapPin className="inline h-3 w-3 mr-1" />
                              {property.location.address}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-lg font-bold text-[#C70000]">
                                ₹{property.price.toLocaleString()}
                              </span>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Eye className="h-3 w-3" />
                                <span>{property.views} views</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <MessageSquare className="h-3 w-3" />
                                <span>{property.inquiries} inquiries</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {getStatusBadge(property.approvalStatus)}
                            {property.isPremium && (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                  {stats.unreadNotifications > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {stats.unreadNotifications} unread
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification, idx) => (
                      <div
                        key={
                          (notification as any)._id || notification.title || idx
                        }
                        className={`border rounded-lg p-4 ${
                          notification.isRead
                            ? "bg-gray-50"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  markNotificationAsRead(notification._id)
                                }
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                deleteNotification(notification._id)
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>My Posted Properties</span>
                </CardTitle>
                <Link to="/post-property">
                  <Button className="bg-[#C70000] hover:bg-[#A60000]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Property
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">
                      No properties posted yet
                    </p>
                    <Link to="/post-property">
                      <Button className="bg-[#C70000] hover:bg-[#A60000]">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Property
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Inquiries</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property, idx) => (
                        <TableRow
                          key={
                            (property as any)._id ||
                            (property as any).id ||
                            property.title ||
                            idx
                          }
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {property.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                Posted{" "}
                                {new Date(
                                  property.createdAt,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-[#C70000]">
                              ₹{property.price.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {property.location.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(property.approvalStatus)}
                            {property.approvalStatus === "rejected" &&
                              property.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Reason: {property.rejectionReason}
                                </p>
                              )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{property.views}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{property.inquiries}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages Center</span>
                  {stats.unreadMessages > 0 && (
                    <Badge className="bg-red-500 text-white">
                      {stats.unreadMessages} unread
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, idx) => (
                      <div
                        key={(message as any)._id || message.timestamp || idx}
                        className={`border rounded-lg p-4 ${
                          message.isRead
                            ? "bg-gray-50"
                            : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {message.buyerName}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {message.buyerEmail}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {message.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Property: {message.propertyTitle}</span>
                              <span>
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Reply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Post Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Profile Views</span>
                      <span className="font-bold text-blue-600">
                        {stats.profileViews}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Property Views</span>
                      <span className="font-bold text-green-600">
                        {stats.totalViews}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Interested Buyers</span>
                      <span className="font-bold text-purple-600">
                        {stats.totalInquiries}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Premium Listings</span>
                      <span className="font-bold text-amber-600">
                        {stats.premiumListings}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Enhance Visibility</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Upgrade to premium to get more visibility and better reach
                      for your properties.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">Featured listings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">
                          Priority in search results
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">10x more visibility</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => setActiveTab("payments")}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blog</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Link to="/seller/blog">
                    <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                      Create Blog Post
                    </Button>
                  </Link>
                  <Link to="/seller/blog">
                    <Button variant="outline">My Posts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Packages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Available Packages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {packages.map((pkg, idx) => (
                      <div
                        key={(pkg as any)._id || pkg.name || idx}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">{pkg.name}</h3>
                          <Badge
                            className={
                              pkg.type === "elite"
                                ? "bg-purple-100 text-purple-800"
                                : pkg.type === "premium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {pkg.type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-[#C70000] mb-3">
                          ₹{pkg.price.toLocaleString()}
                          <span className="text-sm text-gray-500">
                            /{pkg.duration} days
                          </span>
                        </div>
                        <div className="space-y-1 mb-4">
                          {pkg.features.map((feature, index) => (
                            <div
                              key={`${pkg._id}-${feature}-${index}`}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full bg-[#C70000] hover:bg-[#A60000]">
                          Purchase Package
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No payments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((payment, idx) => (
                        <div
                          key={
                            (payment as any)._id || payment.transactionId || idx
                          }
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {payment.package}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(payment.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                Transaction ID: {payment.transactionId}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#C70000]">
                                ₹{payment.amount.toLocaleString()}
                              </div>
                              <Badge
                                className={
                                  payment.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : payment.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }
                              >
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button onClick={updateProfile} className="w-full">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security & Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button onClick={changePassword} className="w-full mb-4">
                    Change Password
                  </Button>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailNotifications">
                        Email Notifications
                      </Label>
                      <Switch
                        id="emailNotifications"
                        checked={profileData.emailNotifications}
                        onCheckedChange={(checked) =>
                          setProfileData((prev) => ({
                            ...prev,
                            emailNotifications: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pushNotifications">
                        Push Notifications
                      </Label>
                      <Switch
                        id="pushNotifications"
                        checked={profileData.pushNotifications}
                        onCheckedChange={(checked) =>
                          setProfileData((prev) => ({
                            ...prev,
                            pushNotifications: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full mt-4"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}
