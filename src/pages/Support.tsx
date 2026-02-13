import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { BrandName } from "@/components/BrandName";

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel("chat-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !user) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      sender_id: user.id,
      message: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
  };

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Soporte</h2>
        <p className="text-muted-foreground mb-4">Inicia sesión para acceder al chat de soporte</p>
        <Button onClick={() => navigate("/auth", { state: { from: "/support" } })}>Iniciar Sesión</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <BrandName className="text-sm text-primary mb-2 block" />
      <h1 className="text-2xl font-bold mb-4">Soporte</h1>
      <Card className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Envía un mensaje para iniciar la conversación</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                msg.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="border-t p-3 flex gap-2">
          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
