"use client";

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RegenerationStyle } from "@/lib/chat/recipe-schema";
import { ChatCommunityDiscovery } from "@/components/chat-community-discovery";
import { LAUNCH_PERSONAS } from "@/lib/personas/launch-personas";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parsed_entities?: {
    recipe?: Recipe;
    regenerationStyle?: RegenerationStyle;
    recipeId?: string;
  };
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
  instruction?: string;
};

type SuggestedFix = {
  label: string;
  instruction: string;
  regenerationStyle?: RegenerationStyle;
};

type InferredStyle = {
  id: string;
  label: string;
  cuisine: string;
  region: string | null;
  confidence: number;
};

type StyleInferenceResult = {
  primaryStyle: InferredStyle;
  alternatives: InferredStyle[];
  reasoningTags: string[];
  originalMessage: string;
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
  const [styleInference, setStyleInference] = useState<StyleInferenceResult | null>(null);
  const [showStyleAlternatives, setShowStyleAlternatives] = useState(false);
  const startThreadInFlightRef = useRef(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [suggestedFix, setSuggestedFix] = useState<SuggestedFix | null>(null);

  async function trackEvent(eventName: string, eventProps?: Record<string, unknown>) {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, eventProps }),
      });
    } catch {
      // Non-blocking analytics
    }
  }

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
      throw new Error("Unable to load recent kitchen conversations");
    }

    const data = (await response.json()) as { threads: ThreadSummary[] };
    setThreads(data.threads);
  }

  const persona = useMemo(
    () => LAUNCH_PERSONAS.find((item) => item.id === activePersonaId),
    [activePersonaId],
  );
  const kitchenThemeClass = useMemo(() => {
    const cuisine = persona?.cuisine.toLowerCase();
    if (!cuisine) return "kitchen-theme-home";
    if (cuisine.includes("ital")) return "kitchen-theme-italian";
    if (cuisine.includes("mex")) return "kitchen-theme-mexican";
    if (cuisine.includes("greek")) return "kitchen-theme-greek";
    if (cuisine.includes("span")) return "kitchen-theme-spanish";
    if (cuisine.includes("french")) return "kitchen-theme-french";
    if (cuisine.includes("leban")) return "kitchen-theme-lebanese";
    if (cuisine.includes("pers")) return "kitchen-theme-persian";
    if (cuisine.includes("chin")) return "kitchen-theme-chinese";
    if (cuisine.includes("ind")) return "kitchen-theme-indian";
    if (cuisine.includes("japan")) return "kitchen-theme-japanese";
    if (cuisine.includes("jama")) return "kitchen-theme-jamaican";
    return "kitchen-theme-home";
  }, [persona]);
  const starterPrompts = useMemo(() => {
    if (!persona) {
      return [
        "I have chicken, onion, garlic, and tomatoes. What should I cook?",
        "I need a quick weeknight comfort meal for 4.",
      ];
    }

    return [
      `My grandma is ${persona.cuisine.toLowerCase()} and I want something nostalgic for Sunday dinner.`,
      `Use ${persona.signatures[0]} inspiration but with what I have in my fridge.`,
      `Make a weeknight version of a ${persona.cuisine.toLowerCase()} family comfort dish.`,
    ];
  }, [persona]);

  useEffect(() => {
    async function fetchThreads() {
      try {
        await refreshThreads();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load your conversations");
      }
    }

    void fetchThreads();
  }, []);

  useEffect(() => {
    async function startThread() {
      if (threadId || !activePersonaId || startThreadInFlightRef.current) {
        return;
      }

      startThreadInFlightRef.current = true;
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
        await trackEvent("chat_thread_started", {
          personaId: activePersonaId,
          threadId: data.threadId,
        });
        await refreshThreads();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to start your conversation");
      } finally {
        startThreadInFlightRef.current = false;
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
        setError(cause instanceof Error ? cause.message : "Unable to load this conversation");
      }
    }

    void fetchThread();
  }, [router, threadId]);

  useEffect(() => {
    const node = chatWindowRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = composerTextareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 280);
    textarea.style.height = `${nextHeight}px`;
  }, [input]);

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
        recipeId?: string;
      };

      setMessages((current) =>
        data.userMessage ? [...current, data.userMessage, data.assistantMessage] : [...current, data.assistantMessage],
      );
      setInput("");
      setSuggestedFix(null);
      await trackEvent("chat_message_sent", {
        threadId,
        regenerationStyle: payload.regenerationStyle ?? null,
        usedInstruction: Boolean(payload.instruction),
        recipeId: data.recipeId ?? data.assistantMessage.parsed_entities?.recipeId ?? null,
      });
      await refreshThreads();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message");
    } finally {
      setIsLoading(false);
    }
  }

  function inferPersonaIdFromInput(content: string): string {
    const text = content.toLowerCase();

    if (text.includes("sicilian") || text.includes("neapolitan") || text.includes("italian-american") || text.includes("nonna") || text.includes("italian")) {
      return "nonna-rosa";
    }
    if (text.includes("oaxacan") || text.includes("mexican") || text.includes("abuelita") || text.includes("mole")) {
      return "abuelita-carmen";
    }
    if (text.includes("greek") || text.includes("yiayia") || text.includes("moussaka")) {
      return "yiayia-eleni";
    }
    if (text.includes("spanish") || text.includes("paella") || text.includes("abuela")) {
      return "abuela-lucia";
    }
    if (text.includes("french") || text.includes("provencal") || text.includes("coq")) {
      return "mamie-colette";
    }
    if (text.includes("lebanese") || text.includes("teta") || text.includes("mujadara")) {
      return "teta-miriam";
    }
    if (text.includes("persian") || text.includes("tahdig") || text.includes("ghormeh") || text.includes("fesenjan")) {
      return "maman-parisa";
    }
    if (text.includes("chinese") || text.includes("nai nai") || text.includes("jiaozi") || text.includes("wok")) {
      return "nai-nai-mei";
    }
    if (text.includes("indian") || text.includes("dadi") || text.includes("masala") || text.includes("dal")) {
      return "dadi-asha";
    }
    if (text.includes("japanese") || text.includes("obaachan") || text.includes("miso") || text.includes("onigiri")) {
      return "obaachan-yumi";
    }
    if (text.includes("jamaican") || text.includes("jerk") || text.includes("rice and peas") || text.includes("ackee")) {
      return "grandma-inez";
    }

    return threads.find((thread) => thread.persona_id)?.persona_id ?? "nonna-rosa";
  }

  function inferPersonaIdFromCuisine(cuisine: string): string {
    const matched = LAUNCH_PERSONAS.find(
      (personaOption) => personaOption.cuisine.toLowerCase() === cuisine.toLowerCase(),
    );
    if (matched) {
      return matched.id;
    }

    return inferPersonaIdFromInput(cuisine);
  }

  async function startThreadAndSendMessage(params: {
    content: string;
    personaId: string;
    styleSelection?: {
      selectedStyleId: string;
      inferredStyleId?: string;
      confidence?: number;
      reasoningTags?: string[];
    };
  }) {
    const { content, personaId, styleSelection } = params;

    const response = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId }),
    });

    if (!response.ok) {
      throw new Error(await toApiError(response, "Unable to start chat thread"));
    }

    const data = (await response.json()) as { threadId: string };
    setThreadId(data.threadId);
    setActivePersonaId(personaId);
    router.replace(`/chat?persona=${personaId}&thread=${data.threadId}`);
    await refreshThreads();

    if (styleSelection) {
      const confirmResponse = await fetch("/api/style/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: data.threadId,
          selectedStyleId: styleSelection.selectedStyleId,
          inferredStyleId: styleSelection.inferredStyleId ?? styleSelection.selectedStyleId,
          confidence: styleSelection.confidence ?? null,
          reasoningTags: styleSelection.reasoningTags ?? [],
          accepted: true,
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error(await toApiError(confirmResponse, "Unable to confirm cooking style"));
      }
    }

    const messageResponse = await fetch(`/api/chat/${data.threadId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!messageResponse.ok) {
      throw new Error(await toApiError(messageResponse, "Unable to send message"));
    }

    const messageData = (await messageResponse.json()) as {
      userMessage: Message | null;
      assistantMessage: Message;
      recipeId?: string;
    };

    setMessages((current) =>
      messageData.userMessage
        ? [...current, messageData.userMessage, messageData.assistantMessage]
        : [...current, messageData.assistantMessage],
    );
    setInput("");
    setSuggestedFix(null);
    setStyleInference(null);
    setShowStyleAlternatives(false);

    await trackEvent("chat_thread_auto_inferred_and_started", {
      personaId,
      threadId: data.threadId,
      inferredStyleId: styleSelection?.inferredStyleId ?? null,
      selectedStyleId: styleSelection?.selectedStyleId ?? null,
    });
    await refreshThreads();
  }

  async function handleStyleSelection(style: InferredStyle) {
    if (!styleInference) {
      return;
    }

    const personaId = inferPersonaIdFromCuisine(style.cuisine);
    setIsLoading(true);
    setError(null);
    try {
      await startThreadAndSendMessage({
        content: styleInference.originalMessage,
        personaId,
        styleSelection: {
          selectedStyleId: style.id,
          inferredStyleId: styleInference.primaryStyle.id,
          confidence: style.confidence,
          reasoningTags: styleInference.reasoningTags,
        },
      });

      await trackEvent("chat_style_selected", {
        source: "inference_prompt",
        selectedStyleId: style.id,
        inferredStyleId: styleInference.primaryStyle.id,
        confidence: style.confidence,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to apply inferred style");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content) {
      return;
    }

    if (!threadId) {
      if (!activePersonaId) {
        setIsLoading(true);
        setError(null);
        try {
          const inferResponse = await fetch("/api/style/infer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              threadId: null,
              message: content,
              currentStyleId: null,
            }),
          });

          if (!inferResponse.ok) {
            throw new Error(await toApiError(inferResponse, "Unable to infer cooking style"));
          }

          const inferData = (await inferResponse.json()) as {
            primaryStyle: InferredStyle;
            alternatives: InferredStyle[];
            reasoningTags: string[];
          };

          setStyleInference({
            primaryStyle: inferData.primaryStyle,
            alternatives: inferData.alternatives,
            reasoningTags: inferData.reasoningTags,
            originalMessage: content,
          });
          setShowStyleAlternatives(false);

          await trackEvent("chat_style_inference_shown", {
            primaryStyleId: inferData.primaryStyle.id,
            confidence: inferData.primaryStyle.confidence,
          });
          return;
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Unable to infer style, using default flow");
        } finally {
          setIsLoading(false);
        }
      }

      const personaId = activePersonaId ?? inferPersonaIdFromInput(content);
      setIsLoading(true);
      setError(null);

      try {
        await startThreadAndSendMessage({ content, personaId });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to start your chat");
      } finally {
        setIsLoading(false);
      }
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

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (isLoading || !input.trim()) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  function onUseStarterPrompt(prompt: string) {
    setInput(prompt);
    composerTextareaRef.current?.focus();
    void trackEvent("chat_starter_prompt_clicked", {
      prompt,
      personaId: activePersonaId ?? null,
      source: "chat_starter_chip",
      copyVersion: "ux-conversion-v1",
    });
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
  const latestRecipeId = [...messages]
    .reverse()
    .find((message) => message.parsed_entities?.recipeId)?.parsed_entities?.recipeId;

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

  async function submitRecipeFeedback(category: "too_salty" | "too_bland" | "too_long" | "too_spicy") {
    if (!latestRecipeId) {
      setError("No saved recipe id found for feedback.");
      return;
    }

    setError(null);
    const response = await fetch(`/api/recipes/${latestRecipeId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Unable to submit feedback");
      return;
    }

    await trackEvent("chat_feedback_submitted", {
      recipeId: latestRecipeId,
      category,
    });

    if (category === "too_salty") {
      setSuggestedFix({
        label: "Apply lower-salt revision",
        instruction: "Reduce salt intensity by 25 percent and balance with acidity and herbs.",
      });
      return;
    }

    if (category === "too_bland") {
      setSuggestedFix({
        label: "Boost flavor depth",
        instruction: "Increase aromatic layering, add acid, and deepen seasoning.",
        regenerationStyle: "traditional",
      });
      return;
    }

    if (category === "too_long") {
      setSuggestedFix({
        label: "Create a weeknight version",
        instruction: "Reduce prep complexity and keep total time under 30 minutes.",
        regenerationStyle: "faster",
      });
      return;
    }

    setSuggestedFix({
      label: "Tone down spice",
      instruction: "Reduce chili heat and keep flavor using aromatics and mild herbs.",
    });
  }

  async function applySuggestedFix() {
    if (!suggestedFix) {
      return;
    }

    await sendMessage({
      regenerateFromLatest: true,
      regenerationStyle: suggestedFix.regenerationStyle,
      instruction: suggestedFix.instruction,
    });
    await trackEvent("chat_suggested_fix_applied", {
      threadId,
      label: suggestedFix.label,
    });
  }

  return (
    <section className={`chat-layout kitchen-theme ${kitchenThemeClass}`}>
      <aside className="chat-sidebar">
        <h3>Recent Conversations</h3>
        {threads.length === 0 ? <p>No conversations yet. Start by sharing what you have in your kitchen.</p> : null}
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
        <h2>Cook With Grandma</h2>
        {!activePersonaId ? <p>Describe your background and ingredients. We&apos;ll choose the best grandma style automatically.</p> : null}
        {persona ? (
          <div className="chat-hero">
            <p>
              Cooking with {persona.name} ({persona.cuisine})
            </p>
            <div className="chip-row">
              {persona.signatures.map((signature) => (
                <span className="chip" key={signature}>
                  {signature}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

        {styleInference && !threadId ? (
          <section className="style-inference-panel">
            <p className="section-kicker">Style suggestion</p>
            <h4>
              {styleInference.primaryStyle.label} ({styleInference.primaryStyle.cuisine})
            </h4>
            <p>
              Confidence: {Math.round(styleInference.primaryStyle.confidence * 100)}%
              {styleInference.primaryStyle.region ? ` • ${styleInference.primaryStyle.region}` : ""}
            </p>
            {styleInference.reasoningTags.length > 0 ? (
              <p className="style-inference-reason">
                Why this style: {styleInference.reasoningTags.join(", ")}
              </p>
            ) : null}
            <div className="style-inference-actions">
              <button
                type="button"
                onClick={() => handleStyleSelection(styleInference.primaryStyle)}
                disabled={isLoading}
              >
                Use This Style
              </button>
              <button
                type="button"
                onClick={() => setShowStyleAlternatives((current) => !current)}
                disabled={isLoading || styleInference.alternatives.length === 0}
              >
                {showStyleAlternatives ? "Hide Options" : "Show Options"}
              </button>
              <button type="button" onClick={() => setStyleInference(null)} disabled={isLoading}>
                Decide Later
              </button>
            </div>
            {showStyleAlternatives ? (
              <div className="style-inference-options">
                {styleInference.alternatives.map((style) => (
                  <button key={style.id} type="button" onClick={() => handleStyleSelection(style)} disabled={isLoading}>
                    {style.label} ({Math.round(style.confidence * 100)}%)
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="chat-window" ref={chatWindowRef}>
          {messages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "msg msg-user" : "msg"}>
              <strong>{message.role === "user" ? "You" : "Grandma"}</strong>
              <p>{message.content}</p>
            </article>
          ))}
          {isLoading ? (
            <article className="msg msg-loading">
              <strong>Grandma</strong>
              <p className="typing-dots" aria-label="Grandma is typing">
                <span />
                <span />
                <span />
              </p>
            </article>
          ) : null}
        </div>

        <form onSubmit={onSendMessage} className="chat-form">
          <div className="chat-composer">
            <textarea
              ref={composerTextareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Share ingredients, cravings, regional clues, and family context. The more detail, the better grandma can personalize your recipe."
              disabled={isLoading}
              rows={3}
              className="chat-textarea"
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? "Cooking..." : "Get Recipe"}
            </button>
          </div>
        </form>

        <div className="starter-row">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="starter-chip"
              onClick={() => onUseStarterPrompt(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <ChatCommunityDiscovery activeCuisine={persona?.cuisine ?? null} onUsePrompt={onUseStarterPrompt} />

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
            <h4>Quick Feedback</h4>
            <div className="feedback-row">
              <button type="button" onClick={() => submitRecipeFeedback("too_salty")}>
                Too Salty
              </button>
              <button type="button" onClick={() => submitRecipeFeedback("too_bland")}>
                Too Bland
              </button>
              <button type="button" onClick={() => submitRecipeFeedback("too_long")}>
                Too Long
              </button>
              <button type="button" onClick={() => submitRecipeFeedback("too_spicy")}>
                Too Spicy
              </button>
            </div>
            {suggestedFix ? (
              <div className="feedback-followup">
                <p>{suggestedFix.label}</p>
                <button type="button" onClick={applySuggestedFix} disabled={isLoading}>
                  Apply Fix
                </button>
              </div>
            ) : null}

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
