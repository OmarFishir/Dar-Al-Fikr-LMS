import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Search,
  Plus,
  User,
  Check,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function formatMsgTime(date: Date) {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export default function Messages() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvRecipientId, setNewConvRecipientId] = useState("");
  const [newConvSubject, setNewConvSubject] = useState("");
  const [newConvMsg, setNewConvMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: me } = trpc.auth.me.useQuery();
  const role = (me?.role === "teacher" || me?.role === "admin") ? "teacher" : "student";

  const { data: conversations, isLoading: loadingConvs } = trpc.messages.conversations.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: messages, isLoading: loadingMsgs } = trpc.messages.thread.useQuery(
    { conversationId: selectedConvId! },
    { enabled: !!selectedConvId, refetchInterval: 10000 }
  );
  const { data: users } = trpc.messages.searchUsers.useQuery({ query: search }, { enabled: search.length > 1 });

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.messages.thread.invalidate({ conversationId: selectedConvId! });
      utils.messages.conversations.invalidate();
      utils.messages.unreadCount.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const startConversation = trpc.messages.startConversation.useMutation({
    onSuccess: (data) => {
      setShowNewConv(false);
      setNewConvRecipientId("");
      setNewConvSubject("");
      setNewConvMsg("");
      setSelectedConvId(data.conversationId);
      utils.messages.conversations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => utils.messages.unreadCount.invalidate(),
  });

  useEffect(() => {
    if (selectedConvId) markRead.mutate({ conversationId: selectedConvId });
  }, [selectedConvId, messages?.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConvs = conversations?.filter((c) =>
    c.otherUserName?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedConv = conversations?.find((c) => c.id === selectedConvId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvId) return;
    sendMessage.mutate({ conversationId: selectedConvId, content: newMessage.trim() });
  };

  return (
    <SchoolLayout role={role}>
      <div className="space-y-4 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="overline">Messages</p>
            <h1 className="font-serif text-3xl font-bold text-foreground">Inbox</h1>
          </div>
          <Button
            onClick={() => setShowNewConv(true)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
          >
            <Plus className="w-4 h-4" /> New Message
          </Button>
        </div>

        <div className="editorial-card overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="pl-8 h-8 text-xs rounded-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConvs ? (
                  <div className="p-6 text-center">
                    <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
                  </div>
                ) : !filteredConvs || filteredConvs.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" strokeWidth={1} />
                    <p className="text-xs text-muted-foreground font-sans">No conversations yet</p>
                    <button
                      onClick={() => setShowNewConv(true)}
                      className="text-xs font-medium font-sans text-foreground underline underline-offset-2"
                    >
                      Start one →
                    </button>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left border-b border-border/50 hover:bg-accent/30 transition-colors",
                        selectedConvId === conv.id && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-sm bg-foreground/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-serif font-bold text-foreground">
                            {conv.otherUserName?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm font-sans truncate", conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                              {conv.otherUserName ?? "Unknown"}
                            </p>
                            <span className="text-xs text-muted-foreground font-sans flex-shrink-0">
                              {conv.lastMessageAt ? formatMsgTime(new Date(conv.lastMessageAt)) : ""}
                            </span>
                          </div>
                          {conv.subject && (
                            <p className="text-xs text-muted-foreground font-sans truncate">{conv.subject}</p>
                          )}
                          {conv.lastMessage && (
                            <p className="text-xs text-muted-foreground font-sans truncate mt-0.5">{conv.lastMessage}</p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-sans font-medium flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col min-w-0">
              {!selectedConvId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground font-sans">Select a conversation to read</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread Header */}
                  <div className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm bg-foreground/8 flex items-center justify-center">
                        <span className="text-xs font-serif font-bold text-foreground">
                          {selectedConv?.otherUserName?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium font-sans text-foreground">{selectedConv?.otherUserName}</p>
                        {selectedConv?.subject && (
                          <p className="text-xs text-muted-foreground font-sans">{selectedConv.subject}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loadingMsgs ? (
                      <div className="flex justify-center">
                        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                      </div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground font-sans">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === me?.id;
                        return (
                          <div key={msg.id} className={cn("flex gap-3", isMine ? "justify-end" : "justify-start")}>
                            {!isMine && (
                              <div className="w-7 h-7 rounded-sm bg-foreground/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-serif font-bold text-foreground">
                                  {msg.senderName?.[0]?.toUpperCase() ?? "?"}
                                </span>
                              </div>
                            )}
                            <div className="max-w-[70%] space-y-1">
                              <div
                                className={cn(
                                  "px-4 py-2.5 rounded-sm text-sm font-sans",
                                  isMine
                                    ? "bg-foreground text-background"
                                    : "bg-secondary text-foreground"
                                )}
                              >
                                {msg.content}
                              </div>
                              <p className={cn("text-xs text-muted-foreground font-sans", isMine ? "text-right" : "text-left")}>
                                {format(new Date(msg.createdAt), "h:mm a")}
                                {isMine && msg.isRead && (
                                  <Check className="w-3 h-3 inline ml-1" />
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Write a message…"
                      rows={1}
                      className="flex-1 resize-none rounded-sm text-sm"
                      style={{ minHeight: "38px", maxHeight: "100px" }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-sm hover:bg-foreground/90 disabled:opacity-40 transition-all flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold">New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs overline">Search Recipient</label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a name…"
                className="rounded-sm"
              />
              {users && users.length > 0 && (
                <div className="border border-border rounded-sm divide-y divide-border/50 max-h-40 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setNewConvRecipientId(String(u.id));
                        setSearch(u.name ?? "");
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm font-sans hover:bg-accent/30 transition-colors flex items-center gap-2",
                        newConvRecipientId === String(u.id) && "bg-accent/50"
                      )}
                    >
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-foreground">{u.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">({u.role})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Subject (optional)</label>
              <Input
                value={newConvSubject}
                onChange={(e) => setNewConvSubject(e.target.value)}
                placeholder="e.g. Question about Chapter 5"
                className="rounded-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs overline">Message *</label>
              <Textarea
                value={newConvMsg}
                onChange={(e) => setNewConvMsg(e.target.value)}
                placeholder="Write your message…"
                rows={3}
                className="rounded-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (!newConvRecipientId || !newConvMsg.trim()) {
                    toast.error("Please select a recipient and write a message");
                    return;
                  }
                  startConversation.mutate({
                    recipientId: parseInt(newConvRecipientId),
                    subject: newConvSubject || undefined,
                    message: newConvMsg.trim(),
                  });
                }}
                disabled={startConversation.isPending}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-sm"
              >
                {startConversation.isPending ? "Sending…" : "Send Message"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewConv(false)} className="rounded-sm">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
