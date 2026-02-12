import { ChatClient } from "@/components/chat-client";

export default async function ChatPage({
  searchParams,
}: {
  searchParams?: Promise<{ persona?: string; thread?: string }>;
}) {
  const params = await searchParams;
  const initialPersonaId = params?.persona;
  const initialThreadId = params?.thread;

  return <ChatClient initialPersonaId={initialPersonaId} initialThreadId={initialThreadId} />;
}
