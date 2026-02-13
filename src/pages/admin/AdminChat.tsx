import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

export default function AdminChat() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get unique users who have chatted
  const { data: chatUsers } = useQuery({
    queryKey: ["admin-chat-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("user_id, profiles:user_id(display_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Deduplicate
      const seen = new Set<string>();
      return data?.filter((m) => {
        if (seen.has(m.user_id)) return false;
        seen.add(m.user_id);
        return true;
      }) || [];
    },
  });

  useEffect(() => {
    if (!selectedUserId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", selectedUserId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel("admin-chat-" + selectedUserId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${selectedUserId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedUserId || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      user_id: selectedUserId,
      sender_id: user.id,
      message: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chat de Soporte</h1>
      <div className="grid md:grid-cols-[250px_1fr] gap-4 h-[70vh]">
        {/* Users list */}
        <div className="border rounded-lg overflow-y-auto">
          {chatUsers?.map((cu) => {
            const profile = cu.profiles as any;
            return (
              <button
                key={cu.user_id}
                onClick={() => setSelectedUserId(cu.user_id)}
                className={`w-full text-left p-3 border-b hover:bg-muted transition-colors ${selectedUserId === cu.user_id ? "bg-accent" : ""}`}
              >
                <p className="font-medium text-sm">{profile?.display_name || "Usuario"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </button>
            );
          })}
          {chatUsers?.length === 0 && <p className="text-center text-muted-foreground p-4 text-sm">Sin conversaciones</p>}
        </div>

        {/* Chat area */}
        <Card className="flex flex-col">
          {selectedUserId ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                      msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
                <Input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Responder..." disabled={sending} />
                <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full text-muted-foreground">
              Selecciona un usuario para ver la conversación
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
