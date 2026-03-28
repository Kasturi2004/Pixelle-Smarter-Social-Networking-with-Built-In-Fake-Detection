import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api, { getImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatConversationTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString();
}

function formatMessageTime(value) {
  const date = new Date(value);
  const hoursAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString();
}

function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const selectedUserId = searchParams.get("user");

  const conversationByUserId = useMemo(
    () =>
      conversations.reduce((lookup, conversation) => {
        if (conversation.otherParticipant?._id) {
          lookup[String(conversation.otherParticipant._id)] = conversation;
        }

        return lookup;
      }, {}),
    [conversations]
  );

  const suggestedUsers = useMemo(() => {
    return [...discoverUsers]
      .sort((firstPerson, secondPerson) => {
        if (firstPerson.isFollowing !== secondPerson.isFollowing) {
          return firstPerson.isFollowing ? -1 : 1;
        }

        const firstHasConversation = Boolean(conversationByUserId[String(firstPerson._id)]);
        const secondHasConversation = Boolean(conversationByUserId[String(secondPerson._id)]);

        if (firstHasConversation !== secondHasConversation) {
          return firstHasConversation ? 1 : -1;
        }

        return (firstPerson.fullName || firstPerson.username).localeCompare(
          secondPerson.fullName || secondPerson.username
        );
      })
      .slice(0, 8);
  }, [conversationByUserId, discoverUsers]);

  async function loadInbox() {
    setLoading(true);

    try {
      const [{ data: conversationsData }, { data: usersData }] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/users")
      ]);

      setConversations(conversationsData.conversations);
      setDiscoverUsers(usersData.users);

      if (!selectedConversationId && !selectedUserId && conversationsData.conversations.length) {
        setSelectedConversationId(conversationsData.conversations[0]._id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    async function startFromQueryUser() {
      if (!selectedUserId) {
        return;
      }

      const { data } = await api.post(`/messages/start/${selectedUserId}`);
      const createdConversation = data.conversation;

      setConversations((currentConversations) => {
        const withoutDuplicate = currentConversations.filter(
          (conversation) => conversation._id !== createdConversation._id
        );
        return [createdConversation, ...withoutDuplicate];
      });
      setSelectedConversationId(createdConversation._id);
      setSearchParams({});
    }

    startFromQueryUser();
  }, [selectedUserId, setSearchParams]);

  useEffect(() => {
    async function loadConversation() {
      if (!selectedConversationId) {
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      const { data } = await api.get(`/messages/${selectedConversationId}`);
      setSelectedConversation(data.conversation);
      setMessages(data.messages);
    }

    loadConversation();
  }, [selectedConversationId]);

  async function startConversationWithUser(targetUserId) {
    const { data } = await api.post(`/messages/start/${targetUserId}`);
    const conversation = data.conversation;

    setConversations((currentConversations) => {
      const withoutDuplicate = currentConversations.filter(
        (currentConversation) => currentConversation._id !== conversation._id
      );
      return [conversation, ...withoutDuplicate];
    });
    setSelectedConversationId(conversation._id);
  }

  async function handleSuggestionSelect(person) {
    const existingConversation = conversationByUserId[String(person._id)];

    if (existingConversation) {
      setSelectedConversationId(existingConversation._id);
      return;
    }

    await startConversationWithUser(person._id);
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!selectedConversationId || !messageText.trim()) {
      return;
    }

    try {
      setSending(true);
      const { data } = await api.post(`/messages/${selectedConversationId}`, {
        text: messageText
      });

      setMessages((currentMessages) => [...currentMessages, data.message]);
      setSelectedConversation(data.conversation);
      setConversations((currentConversations) => {
        const withoutCurrent = currentConversations.filter(
          (conversation) => conversation._id !== data.conversation._id
        );
        return [data.conversation, ...withoutCurrent];
      });
      setMessageText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout>
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="glass-panel rounded-[2rem] border border-white/60 p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral/80">
              Inbox
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Direct messages</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Start one-to-one chats and keep the conversation flowing.
            </p>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/60 p-4 shadow-card">
            <div className="flex items-center justify-between px-2 pb-3">
              <h2 className="text-lg font-semibold text-ink">Conversations</h2>
              <span className="text-sm font-medium text-slate-500">{conversations.length}</span>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm text-slate-500">
                  Loading inbox...
                </div>
              ) : conversations.length ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation._id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                      selectedConversationId === conversation._id
                        ? "bg-coral text-white"
                        : "bg-white/70 text-ink hover:bg-white"
                    }`}
                  >
                    <img
                      src={getImageUrl(conversation.otherParticipant?.profilePic)}
                      alt={conversation.otherParticipant?.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {conversation.otherParticipant?.fullName?.trim() ||
                            conversation.otherParticipant?.username}
                        </p>
                        <span
                          className={`text-xs ${
                            selectedConversationId === conversation._id
                              ? "text-white/80"
                              : "text-slate-400"
                          }`}
                        >
                          {formatConversationTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={`truncate text-sm ${
                          selectedConversationId === conversation._id
                            ? "text-white/85"
                            : "text-slate-500"
                        }`}
                      >
                        {conversation.lastMessage?.text || "Say hello to start chatting."}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm text-slate-500">
                  No conversations yet. Start one below.
                </div>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] border border-white/60 p-4 shadow-card">
            <div className="px-2 pb-3">
              <h2 className="text-lg font-semibold text-ink">Start a chat</h2>
              <p className="mt-1 text-sm text-slate-500">
                Reach out to people you follow first, then explore the rest of Pixelle.
              </p>
            </div>

            <div className="space-y-2">
              {suggestedUsers.length ? (
                suggestedUsers.map((person) => {
                  const existingConversation = conversationByUserId[String(person._id)];

                  return (
                    <button
                      key={person._id}
                      type="button"
                      onClick={() => handleSuggestionSelect(person)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 text-left transition hover:bg-white"
                    >
                      <img
                        src={getImageUrl(person.profilePic)}
                        alt={person.username}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {person.fullName?.trim() || person.username}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm text-slate-500">@{person.username}</p>
                          {person.isFollowing ? (
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-moss ring-1 ring-teal-100">
                              Following
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          existingConversation
                            ? "bg-white text-slate-500 ring-1 ring-orange-100"
                            : "bg-blush text-coral"
                        }`}
                      >
                        {existingConversation ? "Open chat" : "Message"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white/70 px-4 py-4 text-sm text-slate-500">
                  Follow a few people or discover more creators to start chatting.
                </div>
              )}
            </div>
          </section>
        </aside>

        <section className="glass-panel flex min-h-[72vh] flex-col overflow-hidden rounded-[2rem] border border-white/60 shadow-card">
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-orange-100/80 bg-gradient-to-r from-white/70 via-blush/45 to-white/40 px-5 py-4">
                <img
                  src={getImageUrl(selectedConversation.otherParticipant?.profilePic)}
                  alt={selectedConversation.otherParticipant?.username}
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-ink">
                    {selectedConversation.otherParticipant?.fullName?.trim() ||
                      selectedConversation.otherParticipant?.username}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    @{selectedConversation.otherParticipant?.username}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {messages.length ? (
                  messages.map((message) => {
                    const mine = String(message.senderId?._id) === String(user?._id);

                    return (
                      <div
                        key={message._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                            mine
                              ? "bg-coral text-white"
                              : "bg-white/80 text-slate-700 ring-1 ring-orange-100"
                          }`}
                        >
                          <p className="text-sm leading-7">{message.text}</p>
                          <p
                            className={`mt-2 text-xs ${
                              mine ? "text-white/80" : "text-slate-400"
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.75rem] bg-white/65 px-5 py-6 text-sm text-slate-500">
                    No messages yet. Start the conversation below.
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex gap-3 border-t border-orange-100/80 bg-white/50 px-5 py-4"
              >
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 rounded-full border border-orange-100 bg-white px-5 py-3 outline-none focus:border-coral"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-full bg-moss px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral/80">
                  Messages
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Select a conversation</h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                  Choose someone from your inbox or start a new chat from the list on the left.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default MessagesPage;
