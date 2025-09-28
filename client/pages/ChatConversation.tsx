import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Phone,
  MoreVertical,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../hooks/useAuth";
import { io, Socket } from "socket.io-client";
import { toast } from "../components/ui/use-toast";

interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

interface Conversation {
  _id: string;
  buyer: string;
  seller: string;
  property: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    location: { address: string };
  };
  buyerData: {
    _id: string;
    name: string;
    userType: string;
  };
  sellerData: {
    _id: string;
    name: string;
    userType: string;
  };
}

export default function ChatConversation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const socketConnection = io(window.location.origin, {
      auth: {
        token: token,
      },
    });

    setSocket(socketConnection);

    // Join conversation room when conversation is loaded
    if (id && id !== "undefined") {
      socketConnection.emit("join-conversation", id);
    }

    // Listen for new messages
    socketConnection.on("message:new", (messageData) => {
      if (messageData.conversation === id) {
        const newMsg: Message = {
          _id: messageData._id,
          conversationId: messageData.conversation,
          sender: messageData.sender,
          senderId: messageData.sender,
          text: messageData.text,
          createdAt: new Date(messageData.createdAt),
        };

        setMessages((prev) => {
          if (prev.find((m) => m._id === newMsg._id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    socketConnection.on("connect", () => {
      console.log("Socket.io connected");
    });

    socketConnection.on("disconnect", () => {
      console.log("Socket.io disconnected");
    });

    return () => {
      if (id && id !== "undefined") {
        socketConnection.emit("leave-conversation", id);
      }
      socketConnection.disconnect();
    };
  }, [token, isAuthenticated, id]);

  // Fetch conversation details
  const fetchConversation = async () => {
    if (!token || !id || id === "undefined") return;

    try {
      const resp = await (window as any).api(`conversations/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.success) {
        const list = resp.data || resp.json?.data || [];
        const normalizeId = (val: any) => {
          if (!val) return "";
          if (typeof val === "string") return val;
          if (val.$oid) return val.$oid;
          if (val.oid) return val.oid;
          try {
            return val.toString ? val.toString() : String(val);
          } catch {
            return String(val);
          }
        };
        const conv = list.find((c: any) => normalizeId(c._id) === id);
        if (conv) {
          setConversation(conv);
        } else {
          setError("Conversation not found");
        }
      } else {
        setError(resp.error || "Failed to load conversation");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!token || !id || id === "undefined") return;

    try {
      const response = await fetch(`/api/conversations/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 403 || response.status === 404) {
        setError("Conversation not found");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
      } else {
        setError(data.error || "Failed to load messages");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!id || id === "undefined") {
      toast({ title: "Open a property and tap Message Owner" });
      navigate("/chats");
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([fetchConversation(), fetchMessages()]).then(() => {
      setLoading(false);
    });
  }, [id, isAuthenticated, token]);

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !id ||
      id === "undefined" ||
      sendingMessage ||
      !token
    )
      return;

    setSendingMessage(true);
    setError("");

    try {
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Conversation not found
          </h2>
          <p className="text-gray-600 mb-4">
            The conversation you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => navigate("/chats")}
            className="bg-[#C70000] hover:bg-[#A60000] text-white"
          >
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  // Determine other participant
  const otherParticipant =
    conversation.buyer === user?.id
      ? conversation.sellerData
      : conversation.buyerData;
  const property = conversation.property;

  // Mark conversation as read on focus
  useEffect(() => {
    if (!id || !token) return;
    const onFocus = async () => {
      try {
        await fetch(`/api/conversations/${id}/read`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [id, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Conversation Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center space-x-3">
        <button onClick={() => navigate("/chat")} className="p-1">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>

        <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {otherParticipant?.name?.charAt(0) || "U"}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {otherParticipant?.name || "Unknown User"}
          </h3>
          <div className="flex items-center space-x-1">
            <Circle className="h-2 w-2 text-green-500 fill-current" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Property Card */}
      {property && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
            <img
              src={property.images?.[0] || "/placeholder.svg"}
              alt={property.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">
                {property.title}
              </h4>
              <p className="text-xs text-gray-600">
                {property.location?.address}
              </p>
              <p className="text-sm font-semibold text-[#C70000]">
                ₹{(property.price / 100000).toFixed(1)}L
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate(`/property/${property._id}`)}
            >
              View Listing
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMe = message.sender === user?.id;
          const readCount = (message as any).readBy?.length || 1;
          const isRead = isMe && readCount > 1;
          return (
            <div
              key={message._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              data-testid={isMe ? "msg-outgoing" : "msg-incoming"}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMe ? "bg-[#C70000] text-white" : "bg-white text-gray-900"
                } shadow-sm`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <div
                  className={`flex items-center gap-2 text-xs mt-1 ${isMe ? "text-red-100" : "text-gray-500"}`}
                >
                  <span>{formatTime(message.createdAt)}</span>
                  {isMe && <span>{isRead ? "✓✓" : "✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {conversation && (
        <div className="bg-white border-t p-4">
          <div className="flex items-end space-x-2">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              id="file-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  setError("File too large (max 10MB)");
                  return;
                }
                // Attachments upload not implemented; show toast
                toast({
                  title: "Attachments coming soon",
                  description: file.name,
                });
              }}
            />
            <Button
              variant="outline"
              className="px-2"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              📎
            </Button>
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 resize-y max-h-40"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-[#C70000] hover:bg-[#A60000] text-white p-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
