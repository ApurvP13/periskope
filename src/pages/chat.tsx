// pages/chat.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import IconBar from "@/components/IconBar";
import { IoMdSend } from "react-icons/io";
import ChatBar from "@/components/ChatBar";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chatMembers, setChatMembers] = useState<any[]>([]);
  const router = useRouter();

  // Fetch user and chats
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        router.push("/login");
        return;
      }

      setUserId(userId);

      const { data: chatMembersData } = await supabase
        .from("chat_members")
        .select("chat_id, user_id, chats(title, id)")
        .eq("user_id", userId);

      setChatMembers(chatMembersData || []);

      const joinedChats = chatMembersData?.map((cm) => cm.chats);
      setChats(joinedChats || []);
      setSelectedChatId(joinedChats?.[0]?.id || null);
    };

    fetchData();
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChatId) return;
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("created_at");
      setMessages(data || []);

      // Also fetch all members for this chat
      const { data: members } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", selectedChatId);

      setChatMembers(members || []);
    };

    fetchMessages();
  }, [selectedChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messageContainer = document.getElementById("messagesContainer");
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }, [messages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedChatId || !userId) return;

    // Subscribe to messages (INSERT, UPDATE, DELETE)
    const messagesChannel = supabase
      .channel(`messages-${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          const newMessage = payload.new;
          // Only add the message if it's not from the current user (to avoid duplicates)
          // since we've already added our own messages optimistically
          if (newMessage.sender_id !== userId) {
            setMessages((prev) => {
              // Check if we already have this message (avoid duplicates)
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          const updatedMessage = payload.new;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          const deletedMessageId = payload.old.id;
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== deletedMessageId)
          );
        }
      )
      .subscribe();

    // Presence channel for typing indicators and online status
    const presenceChannel = supabase
      .channel(`presence-${selectedChatId}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();

        // Extract online users from presence state
        const online = Object.keys(state).map((key) => {
          const userInfo = state[key][0];
          return userInfo.user_id;
        });

        setOnlineUsers(online);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        // Someone came online
        const userInfo = newPresences[0];
        setOnlineUsers((prev) => [...prev, userInfo.user_id]);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        // Someone went offline
        const userInfo = leftPresences[0];
        setOnlineUsers((prev) => prev.filter((id) => id !== userInfo.user_id));
      });

    // Track typing status
    presenceChannel.track({
      user_id: userId,
      typing: false,
    });

    // Subscribe to typing events
    presenceChannel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload.user_id !== userId) {
        setIsTyping(payload.isTyping);
      }
    });

    presenceChannel.subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [selectedChatId, userId]);

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (!selectedChatId) return;

    const channel = supabase.channel(`presence-${selectedChatId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId, isTyping },
    });
  };

  // Input change handler with debounced typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Show typing indicator when user starts typing
    if (value && value.length > 0) {
      handleTyping(true);

      // Clear typing indicator after 2 seconds of no typing
      clearTimeout((window as any).typingTimeout);
      (window as any).typingTimeout = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    } else {
      handleTyping(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !selectedChatId) return;

    // Clear typing indicator
    handleTyping(false);

    // Create the message object
    const messageToSend = {
      id: crypto.randomUUID(), // Generate a temporary ID
      chat_id: selectedChatId,
      sender_id: userId,
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    // Optimistically update UI
    setMessages((prevMessages) => [...prevMessages, messageToSend]);

    // Clear input
    setNewMessage("");

    // Send to database
    const { error, data } = await supabase
      .from("messages")
      .insert({
        chat_id: selectedChatId,
        sender_id: userId,
        content: newMessage,
      })
      .select();

    if (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message if there was an error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageToSend.id)
      );
      // Put the message back in the input
      setNewMessage(messageToSend.content);
    } else if (data && data[0]) {
      // Replace our temporary message with the real one from the server
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === messageToSend.id ? data[0] : msg))
      );
    }
  };

  // Check if a user is online
  const isUserOnline = (checkUserId: string) => {
    return onlineUsers.includes(checkUserId);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/3 border-r flex  bg-gray-100 p-4 space-y-2 overflow-y-auto">
        <IconBar />
        <div className="">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`p-3 rounded cursor-pointer ${
                selectedChatId === chat.id
                  ? "bg-green-100 font-semibold"
                  : "hover:bg-gray-200"
              }`}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-2/3 flex flex-col justify-between">
        <div
          className="flex-1 bg-[url('/chat-bg.png')] overflow-y-auto p-4 space-y-2"
          id="messagesContainer"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[70%] p-2 rounded ${
                msg.sender_id === userId
                  ? "bg-green-500 text-white ml-auto"
                  : "bg-gray-200"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="px-4 text-sm text-gray-500 italic">
            Someone is typing...
          </div>
        )}

        <div className="border-t p-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2  rounded"
            />
            <button
              onClick={sendMessage}
              className="bg-green-500 px-4 py-2 text-white rounded"
            >
              <IoMdSend />
            </button>
          </div>
          <div className="">
            <ChatBar />
          </div>
        </div>
      </div>
    </div>
  );
}
