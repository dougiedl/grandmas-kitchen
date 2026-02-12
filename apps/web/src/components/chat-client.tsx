"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RegenerationStyle } from "@/lib/chat/recipe-schema";
import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parsed_entities?: { recipe?: Recipe; regenerationStyle?: RegenerationStyle };
};

type Recipe = {
  title: string;
  cuisine: string;
  servings: number;
  totalMinutes: number;
  ingredients: Array<{ amount: string; item: string }>;
  steps: string[];
  grandmaTips: string[];
};

type ThreadSummary = {
  id: string;
  persona_id: string | null;
  persona_name: string | null;
  cuisine: string | null;
  last_message: string | null;
  last_activity: string;
};

type ThreadPayload = {
  thread: {
    id: string;
    persona_id: string | null;
  };
  messages: Message[];
};

type SendMessagePayload = {
  content?: string;
  regenerationStyle?: RegenerationStyle;
  regenerateFromLatest?: boolean;
};

export function ChatClient({
  initialPersonaId,
  initialThreadId,
}: {
  initialPersonaId?: string;
  initialThreadId?: string;
}) {
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(initialThreadId ?? null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(initialPersonaId ?? null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toApiError(response: Response, fallback: string) {
    try {
      const data = (await response.json()) as { error?: string };
      return data.error ? `${fallback}: ${data.error}` : `${fallback} (status ${response.status})`;
    } catch {
      return `${fallback} (status ${response.status})`;
    }
  }

  async function refreshThreads() {
    const response = await fetch("/api/chat/threads", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load recent conversations");
    }

    const data = (await response.json()) as { threads: ThreadSummary[] };
    setThreads(data.threads);
  }

  const persona = useMemo(
    () => LAUNCH_PERSONAS.find((item) => item.id === activePersonaId),
    [activePersonaId],
  );

  useEffect(() => {
    async function fetchThreads() {
      try {
        await refreshThreads();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load conversations");
      }
    }

    void fetchThreads();
  }, []);

  useEffect(() => {
    async function startThread() {
      if (threadId || !activePersonaId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: activePersonaId }),
        });

        if (!response.ok) {
          throw new Error(await toApiError(response, "Unable to start chat thread"));
        }

        const data = (await response.json()) as { threadId: string };
        setThreadId(data.threadId);
        router.replace(`/chat?persona=${activePersonaId}&thread=${data.threadId}`);
        await refreshThreads();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to start chat");
      } finally {
        setIsLoading(false);
      }
    }

    void startThread();
  }, [activePersonaId, router, threadId]);

  useEffect(() => {
    async function fetchThread() {
      if (!threadId) {
        return;
      }

      try {
        const response = await fetch(`/api/chat/${threadId}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(await toApiError(response, "Unable to load thread messages"));
        }

        const data = (await response.json()) as ThreadPayload;
        setMessages(data.messages);

        if (data.thread.persona_id) {
          setActivePersonaId(data.thread.persona_id);
          router.replace(`/chat?persona=${data.thread.persona_id}&thread=${threadId}`);
        } else {
          router.replace(`/chat?thread=${threadId}`);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load messages");
      }
    }

    void fetchThread();
  }, [router, threadId]);

  async function sendMessage(payload: SendMessagePayload) {
    if (!threadId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${threadId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await toApiError(response, "Unable to send message"));
      }

      const data = (await response.json()) as {
        userMessage: Message | null;
        assistantMessage: Message;
      };

      setMessages((current) =>
        data.userMessage ? [...current, data.userMessage, data.assistantMessage] : [...current, data.assistantMessage],
      );
      setInput("");
      await refreshThreads();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send message");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!threadId || !content) {
      return;
    }

    await sendMessage({ content });
  }

  async function onRegenerate(style: RegenerationStyle) {
    if (!threadId) {
      return;
    }

    await sendMessage({ regenerationStyle: style, regenerateFromLatest: true });
  }

  function onResumeThread(thread: ThreadSummary) {
    setThreadId(thread.id);
    setActivePersonaId(thread.persona_id);
    setMessages([]);
    router.replace(
      thread.persona_id ? `/chat?persona=${thread.persona_id}&thread=${thread.id}` : `/chat?thread=${thread.id}`,
    );
  }

  const latestRecipe = [...messages]
    .reverse()
    .find((message) => message.parsed_entities?.recipe)?.parsed_entities?.recipe;

  const recipeHistory = messages
    .filter((message) => message.role === "assistant" && message.parsed_entities?.recipe)
    .map((message) => ({
      id: message.id,
      recipe: message.parsed_entities?.recipe as Recipe,
      regenerationStyle: message.parsed_entities?.regenerationStyle,
    }))
    .reverse();

  function summarizeDiff(current: Recipe, previous?: Recipe): string {
    if (!previous) {
      return "Initial version";
    }

    const changes: string[] = [];
    if (current.title !== previous.title) {
      changes.push("dish title changed");
    }
    if (current.totalMinutes !== previous.totalMinutes) {
      changes.push(`time ${previous.totalMinutes}m -> ${current.totalMinutes}m`);
    }
    if (current.ingredients.length !== previous.ingredients.length) {
      changes.push(
        `ingredient count ${previous.ingredients.length} -> ${current.ingredients.length}`,
      );
    }
    if (changes.length === 0) {
      return "Minor wording/technique adjustments";
    }
    return changes.join(" • ");
  }

  return (
    <section className="chat-layout">
      <aside className="chat-sidebar">
        <h3>Recent Conversations</h3>
        {threads.length === 0 ? <p>No saved chats yet.</p> : null}
        <div className="thread-list">
          {threads.map((thread) => {
            const isActive = thread.id === threadId;
            return (
              <button
                type="button"
                key={thread.id}
                className={isActive ? "thread-item thread-item-active" : "thread-item"}
                onClick={() => onResumeThread(thread)}
              >
                <strong>{thread.persona_name ?? "Grandma"}</strong>
                <span>{thread.cuisine ?? "Home Style"}</span>
                <span className="thread-preview">{thread.last_message ?? "No messages yet"}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div>
        <h2>Chat</h2>
        {!activePersonaId ? <p>Select a grandma style from Home to begin cooking.</p> : null}
        {persona ? (
          <p>
            Cooking with {persona.name} ({persona.cuisine})
          </p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

        <div className="chat-window">
          {messages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "msg msg-user" : "msg"}>
              <strong>{message.role === "user" ? "You" : "Grandma"}</strong>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <form onSubmit={onSendMessage} className="chat-form">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="I have chicken, tomatoes, onions, and garlic..."
            disabled={!threadId || isLoading}
          />
          <button type="submit" disabled={!threadId || isLoading || !input.trim()}>
            Send
          </button>
        </form>

        {latestRecipe ? (
          <section className="recipe-card">
            <h3>{latestRecipe.title}</h3>
            <p>
              {latestRecipe.cuisine} style • {latestRecipe.servings} servings • {latestRecipe.totalMinutes} min
            </p>
            <div className="regen-row">
              <button type="button" onClick={() => onRegenerate("faster")} disabled={isLoading}>
                Make It Faster
              </button>
              <button type="button" onClick={() => onRegenerate("traditional")} disabled={isLoading}>
                More Traditional
              </button>
              <button type="button" onClick={() => onRegenerate("vegetarian")} disabled={isLoading}>
                Make Vegetarian
              </button>
            </div>
            <h4>Ingredients</h4>
            <ul>
              {latestRecipe.ingredients.map((ingredient) => (
                <li key={`${ingredient.amount}-${ingredient.item}`}>
                  {ingredient.amount} {ingredient.item}
                </li>
              ))}
            </ul>
            <h4>Steps</h4>
            <ol>
              {latestRecipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <h4>Grandma Tips</h4>
            <ul>
              {latestRecipe.grandmaTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>

            <h4>Recipe History</h4>
            <div className="history-list">
              {recipeHistory.map((entry, index) => {
                const previous = recipeHistory[index + 1]?.recipe;
                return (
                  <article className="history-item" key={entry.id}>
                    <strong>v{recipeHistory.length - index}</strong>
                    <p>
                      {entry.recipe.title}
                      {entry.regenerationStyle ? ` (${entry.regenerationStyle})` : ""}
                    </p>
                    <p className="recipe-list-date">{summarizeDiff(entry.recipe, previous)}</p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
