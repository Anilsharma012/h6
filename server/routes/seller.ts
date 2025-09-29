import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

// Get seller's properties
export const getSellerProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    const properties = await db
      .collection("properties")
      .find({ userId: new ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: properties,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties",
    });
  }
};

// Get seller notifications
export const getSellerNotifications: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    console.log(`📬 Fetching notifications for seller: ${sellerId}`);

    // Get all types of notifications and messages for this seller
    const [
      adminNotifications,
      userNotifications,
      conversations,
      unreadMessages,
    ] = await Promise.all([
      // 1. Admin notifications (push notifications, premium plans, general messages)
      db
        .collection("notifications")
        .find({
          $or: [
            { userId: new ObjectId(sellerId) },
            { sellerId: new ObjectId(sellerId) },
            { targetUserId: new ObjectId(sellerId) },
            {
              audience: { $in: ["sellers", "all"] },
            },
            {
              audience: "specific",
              specificUsers: { $in: [sellerId] },
            },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray(),

      // 2. Individual user notifications sent by admin
      db
        .collection("user_notifications")
        .find({
          userId: new ObjectId(sellerId),
        })
        .sort({ sentAt: -1 })
        .toArray(),

      // 3. Property-based conversations where seller is involved
      db
        .collection("conversations")
        .aggregate([
          {
            $match: {
              $or: [
                { seller: new ObjectId(sellerId) },
                { participants: sellerId },
              ],
            },
          },
          {
            $lookup: {
              from: "properties",
              localField: "property",
              foreignField: "_id",
              as: "propertyData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "buyer",
              foreignField: "_id",
              as: "buyerData",
            },
          },
          {
            $lookup: {
              from: "messages",
              localField: "_id",
              foreignField: "conversationId",
              as: "messages",
            },
          },
          {
            $addFields: {
              lastMessage: {
                $arrayElemAt: [
                  {
                    $sortArray: {
                      input: "$messages",
                      sortBy: { createdAt: -1 },
                    },
                  },
                  0,
                ],
              },
              unreadCount: {
                $size: {
                  $filter: {
                    input: "$messages",
                    cond: {
                      $and: [
                        { $ne: ["$$this.senderId", sellerId] },
                        {
                          $not: {
                            $in: [
                              sellerId,
                              {
                                $map: {
                                  input: "$$this.readBy",
                                  as: "reader",
                                  in: "$$reader.userId",
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        ])
        .toArray(),

      // 4. Direct messages to seller (admin replies, etc.)
      db
        .collection("messages")
        .find({
          $or: [
            { receiverId: sellerId },
            { targetUserId: sellerId },
            {
              conversationId: { $exists: false },
              recipientId: sellerId,
            },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray(),
    ]);

    console.log(
      `📊 Found: ${adminNotifications.length} admin notifications, ${userNotifications.length} user notifications, ${conversations.length} conversations, ${unreadMessages.length} direct messages`,
    );

    // Combine all notifications into a unified format
    const unifiedNotifications = [];

    // Add admin notifications
    adminNotifications.forEach((notification) => {
      unifiedNotifications.push({
        id: notification._id,
        title: notification.title || "Admin Notification",
        message: notification.message,
        type: notification.type || "admin_notification",
        sender_role: "admin",
        sender_name: "Admin",
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || notification.sentAt,
        source: "admin_notification",
        priority: notification.priority || "normal",
        propertyId: notification.propertyId || null,
      });
    });

    // Add user notifications (sent by admin to specific users)
    userNotifications.forEach((notification) => {
      unifiedNotifications.push({
        id: notification._id,
        title: notification.title || "Message from Admin",
        message: notification.message,
        type: notification.type || "admin_message",
        sender_role: "admin",
        sender_name: "Admin",
        isRead: !!notification.readAt,
        createdAt: notification.sentAt,
        source: "user_notification",
        priority: "normal",
        propertyId: null,
      });
    });

    // Add conversation-based messages
    conversations.forEach((conversation) => {
      if (conversation.lastMessage && conversation.unreadCount > 0) {
        const property = conversation.propertyData?.[0];
        const buyer = conversation.buyerData?.[0];

        unifiedNotifications.push({
          id: conversation._id,
          title: `New message about ${property?.title || "your property"}`,
          message:
            conversation.lastMessage.message ||
            conversation.lastMessage.content,
          type: "property_inquiry",
          sender_role: conversation.lastMessage.senderType || "buyer",
          sender_name: buyer?.name || "User",
          isRead: false,
          createdAt: conversation.lastMessage.createdAt,
          source: "conversation",
          propertyId: property?._id,
          propertyTitle: property?.title,
          conversationId: conversation._id,
          unreadCount: conversation.unreadCount,
        });
      }
    });

    // Add direct messages
    unreadMessages.forEach((message) => {
      unifiedNotifications.push({
        id: message._id,
        title: message.title || "Direct Message",
        message: message.message || message.content,
        type: message.type || "direct_message",
        sender_role: message.senderType || "admin",
        sender_name: message.senderName || "Admin",
        isRead: message.isRead || false,
        createdAt: message.createdAt,
        source: "direct_message",
        priority: message.priority || "normal",
      });
    });

    // Sort by creation date (newest first)
    unifiedNotifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    console.log(
      `📬 Total unified notifications: ${unifiedNotifications.length}`,
    );

    // If no notifications exist, create sample notifications
    if (unifiedNotifications.length === 0) {
      const sampleNotifications = [
        {
          sellerId: new ObjectId(sellerId),
          userId: new ObjectId(sellerId),
          title: "Welcome to Seller Dashboard",
          message:
            "Your seller account has been successfully activated. You can now start posting properties and managing inquiries!",
          type: "welcome",
          priority: "high",
          isRead: false,
          createdAt: new Date(),
          senderType: "admin",
        },
        {
          sellerId: new ObjectId(sellerId),
          userId: new ObjectId(sellerId),
          title: "Premium Plan Available",
          message:
            "Upgrade to our premium plan to get more visibility for your properties and priority support.",
          type: "premium_offer",
          priority: "normal",
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          senderType: "admin",
        },
      ];

      await db.collection("notifications").insertMany(sampleNotifications);

      const sampleUnified = sampleNotifications.map((notif) => ({
        id: notif._id || new ObjectId(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        sender_role: "admin",
        sender_name: "Admin",
        isRead: notif.isRead,
        createdAt: notif.createdAt,
        source: "admin_notification",
        priority: notif.priority,
      }));

      return res.json({
        success: true,
        data: sampleUnified,
        total: sampleUnified.length,
        unreadCount: sampleUnified.filter((n) => !n.isRead).length,
      });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: unifiedNotifications,
      total: unifiedNotifications.length,
      unreadCount: unifiedNotifications.filter((n) => !n.isRead).length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
      details: error.message,
    });
  }
};

// Mark notification as read
export const markNotificationAsRead: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { notificationId } = req.params;
    const sellerId = (req as any).userId;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        sellerId: new ObjectId(sellerId),
      },
      { $set: { isRead: true, readAt: new Date() } },
    );

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
};

// Delete notification
export const deleteSellerNotification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { notificationId } = req.params;
    const sellerId = (req as any).userId;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    await db.collection("notifications").deleteOne({
      _id: new ObjectId(notificationId),
      sellerId: new ObjectId(sellerId),
    });

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
};

// Get seller messages from buyers
export const getSellerMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    // Get messages where seller is the recipient
    const messages = await db
      .collection("property_inquiries")
      .find({ sellerId: new ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Enhance messages with buyer and property details
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        // Get buyer details
        const buyer = await db
          .collection("users")
          .findOne(
            { _id: message.buyerId },
            { projection: { name: 1, email: 1, phone: 1 } },
          );

        // Get property details
        const property = await db
          .collection("properties")
          .findOne(
            { _id: message.propertyId },
            { projection: { title: 1, price: 1 } },
          );

        return {
          ...message,
          buyerName: buyer?.name || "Unknown Buyer",
          buyerEmail: buyer?.email || "",
          buyerPhone: buyer?.phone || "",
          propertyTitle: property?.title || "Unknown Property",
          propertyPrice: property?.price || 0,
          timestamp: message.createdAt,
          isRead: message.isRead || false,
        };
      }),
    );

    const response: ApiResponse<any[]> = {
      success: true,
      data: enhancedMessages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Get available packages for sellers
export const getSellerPackages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Get packages from unified database or create sample ones
    let packages = await db
      .collection("packages")
      .find({
        $or: [
          { targetUserType: "seller" },
          { category: "advertisement" }, // Legacy support
        ],
      })
      .toArray();

    if (packages.length === 0) {
      // Create sample packages
      const samplePackages = [
        {
          name: "Basic Plan",
          price: 999,
          features: [
            "Post up to 5 properties",
            "Basic listing visibility",
            "Email support",
            "Valid for 30 days",
          ],
          duration: 30,
          type: "basic",
          isActive: true,
          createdAt: new Date(),
        },
        {
          name: "Premium Plan",
          price: 2499,
          features: [
            "Post up to 15 properties",
            "Featured listing placement",
            "Priority in search results",
            "Phone & email support",
            "Property promotion tools",
            "Valid for 60 days",
          ],
          duration: 60,
          type: "premium",
          isActive: true,
          createdAt: new Date(),
        },
        {
          name: "Elite Plan",
          price: 4999,
          features: [
            "Unlimited property postings",
            "Top featured placement",
            "Premium badge on profile",
            "Dedicated account manager",
            "Advanced analytics",
            "Priority customer support",
            "Valid for 90 days",
          ],
          duration: 90,
          type: "elite",
          isActive: true,
          createdAt: new Date(),
        },
      ];

      await db.collection("packages").insertMany(samplePackages);
      packages = samplePackages;
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: packages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
    });
  }
};

// Get seller payment history
export const getSellerPayments: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    const payments = await db
      .collection("payments")
      .find({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller" },
          { sellerId: new ObjectId(sellerId) }, // Support legacy format
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: payments,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller payments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments",
    });
  }
};

// Update seller profile
export const updateSellerProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;
    const { name, email, phone, emailNotifications, pushNotifications } =
      req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Check if email already exists for another user
    const existingUser = await db.collection("users").findOne({
      email,
      _id: { $ne: new ObjectId(sellerId) },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // Update user profile
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          name,
          email,
          phone,
          emailNotifications: emailNotifications ?? true,
          pushNotifications: pushNotifications ?? true,
          updatedAt: new Date(),
        },
      },
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// Change seller password
export const changeSellerPassword: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Get current user
    const user = await db.collection("users").findOne({
      _id: new ObjectId(sellerId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      },
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing seller password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// Purchase package
export const purchasePackage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;
    const { packageId, paymentMethod } = req.body;

    if (!ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid package ID",
      });
    }

    // Get package details from unified collection
    const packageDetails = await db.collection("packages").findOne({
      _id: new ObjectId(packageId),
    });

    if (!packageDetails) {
      return res.status(404).json({
        success: false,
        error: "Package not found",
      });
    }

    // Create payment record
    const payment = {
      sellerId: new ObjectId(sellerId),
      packageId: new ObjectId(packageId),
      package: packageDetails.name,
      amount: packageDetails.price,
      paymentMethod: paymentMethod || "online",
      status: "completed", // In real implementation, this would be pending until payment gateway confirms
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      date: new Date(),
      createdAt: new Date(),
    };

    await db.collection("payments").insertOne(payment);

    // Update seller's package status
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          currentPackage: packageDetails.name,
          packageType: packageDetails.type,
          packageExpiresAt: new Date(
            Date.now() + packageDetails.duration * 24 * 60 * 60 * 1000,
          ),
          isPremium: packageDetails.type !== "basic",
          updatedAt: new Date(),
        },
      },
    );

    // Create notification for successful purchase
    await db.collection("notifications").insertOne({
      sellerId: new ObjectId(sellerId),
      title: "Package Purchase Successful",
      message: `You have successfully purchased the ${packageDetails.name}. Your account has been upgraded!`,
      type: "account",
      isRead: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Package purchased successfully",
      data: {
        transactionId: payment.transactionId,
        package: packageDetails.name,
        amount: packageDetails.price,
      },
    });
  } catch (error) {
    console.error("Error purchasing package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to purchase package",
    });
  }
};

// Get seller dashboard stats
export const getSellerStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    // Get properties stats
    const properties = await db
      .collection("properties")
      .find({ userId: new ObjectId(sellerId) })
      .toArray();

    // Get notifications stats
    const unreadNotifications = await db
      .collection("notifications")
      .countDocuments({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller", isRead: false },
          { sellerId: new ObjectId(sellerId), isRead: false }, // Support legacy format
        ],
      });

    // Get messages stats
    const unreadMessages = await db
      .collection("property_inquiries")
      .countDocuments({
        sellerId: new ObjectId(sellerId),
        isRead: false,
      });

    // Calculate stats
    const stats = {
      totalProperties: properties.length,
      pendingApproval: properties.filter((p) => p.approvalStatus === "pending")
        .length,
      approved: properties.filter((p) => p.approvalStatus === "approved")
        .length,
      rejected: properties.filter((p) => p.approvalStatus === "rejected")
        .length,
      totalViews: properties.reduce((sum, prop) => sum + (prop.views || 0), 0),
      totalInquiries: properties.reduce(
        (sum, prop) => sum + (prop.inquiries || 0),
        0,
      ),
      unreadNotifications,
      unreadMessages,
      premiumListings: properties.filter((p) => p.isPremium).length,
      profileViews: Math.floor(Math.random() * 500) + 100, // Mock data
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
    });
  }
};
