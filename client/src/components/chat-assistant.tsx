import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ChatAssistant() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<
    { role: string; content: string }[]
  >([]);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isLoading]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage = message;
    setMessage("");

    // Add user message to conversation
    setConversation((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...conversation, { role: "user", content: userMessage }] }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setConversation((prev) => {
        // Prevent repeated bot responses
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === "assistant" &&
          prev[prev.length - 1].content.trim() === data.response.trim()
        ) {
          return prev;
        }
        return [
          ...prev,
          { role: "assistant", content: data.response },
        ];
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full absolute top-3 right-3 z-20"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] h-full flex flex-col z-50">
        <SheetHeader>
          <SheetTitle>Maharashtra Tour Guide Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4 space-y-4 bg-gray-50 rounded-lg">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <span role="img" aria-label="bot">🤖</span>
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[75%] shadow-sm text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-white mr-8 border border-gray-200"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center ml-2">
                  <span role="img" aria-label="user">🧑</span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <span role="img" aria-label="bot">🤖</span>
              </div>
              <div className="p-3 rounded-2xl max-w-[75%] shadow-sm text-sm bg-white border border-gray-200 animate-pulse">
                ...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 pt-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about places, culture, or travel tips..."
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
