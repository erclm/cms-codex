'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Event, Product, ProductStatus } from "@/lib/types";

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  price: string;
  status: ProductStatus;
  summary: string;
  description: string;
};

type EventFormState = {
  id?: string;
  title: string;
  description: string;
  status: "draft" | "published";
  starts_at: string;
  ends_at: string;
};

const emptyProduct: ProductFormState = {
  name: "",
  slug: "",
  price: "",
  status: "published",
  summary: "",
  description: "",
};

const emptyEvent: EventFormState = {
  title: "",
  description: "",
  status: "published",
  starts_at: "",
  ends_at: "",
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatMoney(priceCents: number) {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProduct);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEvent);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [issueMessage, setIssueMessage] = useState<string | null>(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [themeTitle, setThemeTitle] = useState("");
  const [themeNotes, setThemeNotes] = useState("");

  const refreshData = useCallback(async () => {
    const [{ data: productRows }, { data: eventRows }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("events").select("*").order("starts_at", {
        ascending: true,
        nullsFirst: true,
      }),
    ]);

    setProducts(productRows ?? []);
    setEvents(eventRows ?? []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
      setSessionReady(true);
      if (data.session) {
        void refreshData();
      }
    });
  }, [refreshData, supabase]);

  const handleProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProduct(true);

    const priceCents = Math.max(
      0,
      Math.round(Number.parseFloat(productForm.price || "0") * 100)
    );

    const payload = {
      name: productForm.name,
      slug: productForm.slug || toSlug(productForm.name),
      price_cents: priceCents,
      status: productForm.status,
      summary: productForm.summary || null,
      description: productForm.description || null,
    };

    if (productForm.id) {
      await supabase
        .from("products")
        .update(payload)
        .eq("id", productForm.id);
    } else {
      await supabase.from("products").insert([payload]);
    }

    setProductForm(emptyProduct);
    setSavingProduct(false);
    void refreshData();
  };

  const handleProductEdit = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      slug: product.slug ?? "",
      price: (product.price_cents / 100).toString(),
      status: product.status,
      summary: product.summary ?? "",
      description: product.description ?? "",
    });
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    void refreshData();
  };

  const toggleProductStatus = async (product: Product) => {
    await supabase
      .from("products")
      .update({
        status: product.status === "published" ? "draft" : "published",
      })
      .eq("id", product.id);
    void refreshData();
  };

  const handleEventSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingEvent(true);

    const payload = {
      title: eventForm.title,
      description: eventForm.description || null,
      status: eventForm.status,
      starts_at: eventForm.starts_at || null,
      ends_at: eventForm.ends_at || null,
    };

    if (eventForm.id) {
      await supabase.from("events").update(payload).eq("id", eventForm.id);
    } else {
      await supabase.from("events").insert([payload]);
    }

    setEventForm(emptyEvent);
    setSavingEvent(false);
    void refreshData();
  };

  const handleEventEdit = (item: Event) => {
    setEventForm({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      status: item.status,
      starts_at: item.starts_at
        ? item.starts_at.substring(0, 16)
        : "",
      ends_at: item.ends_at ? item.ends_at.substring(0, 16) : "",
    });
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    void refreshData();
  };

  const submitThemeIssue = async (event: React.FormEvent) => {
    event.preventDefault();
    setIssueLoading(true);
    setIssueMessage(null);

    const response = await fetch("/api/github/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: themeTitle || "New theme request",
        body:
          themeNotes ||
          "Generate a new storefront theme for the Codex CMS demo.",
        labels: ["codex-request", "theme"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.json().catch(() => ({}));
      setIssueMessage(
        errorText?.error || "Failed to create GitHub issue. Check server logs."
      );
      setIssueLoading(false);
      return;
    }

    const json = await response.json();
    setIssueMessage(`Created issue #${json.issue.number}`);
    setThemeTitle("");
    setThemeNotes("");
    setIssueLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthed(false);
    router.replace("/login");
  };

  if (!sessionReady) {
    return (
      <main className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg shadow-black/30">
        <p className="text-[var(--muted)]">Checking session…</p>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg shadow-black/30">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="text-[var(--muted)]">
          You need to log in to access the CMS.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          Go to login
        </button>
      </main>
    );
  }

  return (
    <main className="space-y-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg shadow-black/30 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            CMS Control
          </p>
          <h1 className="text-3xl font-semibold">Admin dashboard</h1>
          <p className="text-[var(--muted)]">
            Manage products, events, and send a Codex theme request straight to
            GitHub.
          </p>
        </div>
        <button
          onClick={logout}
          className="self-start rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Products
              </p>
              <h2 className="text-xl font-semibold">Catalog</h2>
            </div>
            {productForm.id && (
              <button
                onClick={() => setProductForm(emptyProduct)}
                className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
              >
                New item
              </button>
            )}
          </div>

          <form
            onSubmit={handleProductSubmit}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <label className="text-sm text-[var(--muted)]">
              Name
              <input
                required
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="text-sm text-[var(--muted)]">
              Slug
              <input
                value={productForm.slug}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="auto-generated if blank"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="text-sm text-[var(--muted)]">
              Price (USD)
              <input
                required
                type="number"
                min="0"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, price: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="text-sm text-[var(--muted)]">
              Status
              <select
                value={productForm.status}
                onChange={(e) =>
                  setProductForm((p) => ({
                    ...p,
                    status: e.target.value as ProductStatus,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className="sm:col-span-2 text-sm text-[var(--muted)]">
              Summary
              <input
                value={productForm.summary}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, summary: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="sm:col-span-2 text-sm text-[var(--muted)]">
              Description
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <div className="sm:col-span-2 flex items-center justify-between">
              <span className="text-xs text-[var(--muted)]">
                {productForm.id ? "Editing existing product" : "New product"}
              </span>
              <button
                type="submit"
                disabled={savingProduct}
                className="rounded-full bg-[var(--accent-strong)] px-5 py-2 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
              >
                {savingProduct
                  ? "Saving..."
                  : productForm.id
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {products.length === 0 ? (
              <p className="text-[var(--muted)]">
                No products yet. Add one above.
              </p>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                      {product.slug || "no-slug"}
                    </p>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-[var(--muted)]">
                      {product.summary || "No summary"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-sm text-[var(--foreground)]">
                      {formatMoney(product.price_cents)}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                        product.status === "published"
                          ? "bg-emerald-500/15 text-[var(--accent)]"
                          : "bg-white/10 text-[var(--muted)]"
                      )}
                    >
                      {product.status}
                    </span>
                    <button
                      onClick={() => toggleProductStatus(product)}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => handleProductEdit(product)}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Events
                </p>
                <h2 className="text-xl font-semibold">Schedule</h2>
              </div>
              {eventForm.id && (
                <button
                  onClick={() => setEventForm(emptyEvent)}
                  className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  New event
                </button>
              )}
            </div>

            <form onSubmit={handleEventSubmit} className="mt-4 space-y-3">
              <label className="block text-sm text-[var(--muted)]">
                Title
                <input
                  required
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <label className="block text-sm text-[var(--muted)]">
                Description
                <textarea
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-[var(--muted)]">
                  Start (UTC)
                  <input
                    type="datetime-local"
                    value={eventForm.starts_at}
                    onChange={(e) =>
                      setEventForm((p) => ({ ...p, starts_at: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                  />
                </label>

                <label className="text-sm text-[var(--muted)]">
                  End (UTC)
                  <input
                    type="datetime-local"
                    value={eventForm.ends_at}
                    onChange={(e) =>
                      setEventForm((p) => ({ ...p, ends_at: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                  />
                </label>
              </div>

              <label className="text-sm text-[var(--muted)]">
                Status
                <select
                  value={eventForm.status}
                  onChange={(e) =>
                    setEventForm((p) => ({
                      ...p,
                      status: e.target.value as "draft" | "published",
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)]">
                  {eventForm.id ? "Editing existing event" : "New event"}
                </span>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="rounded-full bg-[var(--accent-strong)] px-5 py-2 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
                >
                  {savingEvent
                    ? "Saving..."
                    : eventForm.id
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {events.length === 0 ? (
                <p className="text-[var(--muted)]">
                  No events. Add one above.
                </p>
              ) : (
                events.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-2 text-[var(--muted)]">
                      <span className="text-xs uppercase tracking-[0.2em]">
                        {item.status}
                      </span>
                      {item.starts_at && (
                        <span className="text-xs text-[var(--accent)]">
                          {new Date(item.starts_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-[var(--muted)]">
                          {item.description || "No description"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEventEdit(item)}
                          className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEvent(item.id)}
                          className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:text-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#15304f] via-[var(--card)] to-[#0b1c2f] p-6 shadow-lg shadow-black/30">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Codex
            </p>
            <h2 className="text-xl font-semibold">
              Generate a new theme with a GitHub issue
            </h2>
            <p className="text-[var(--muted)]">
              Submit a request and the GitHub Action will run{" "}
              <code>openai/codex-action@v1</code> to build a theme branch and
              open a PR.
            </p>

            <form onSubmit={submitThemeIssue} className="mt-4 space-y-3">
              <label className="block text-sm text-[var(--muted)]">
                Issue title
                <input
                  required
                  value={themeTitle}
                  onChange={(e) => setThemeTitle(e.target.value)}
                  placeholder="Ex: Generate a neon storefront theme"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="block text-sm text-[var(--muted)]">
                Notes for Codex
                <textarea
                  value={themeNotes}
                  onChange={(e) => setThemeNotes(e.target.value)}
                  rows={3}
                  placeholder="Colors, vibe, constraints…"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <button
                type="submit"
                disabled={issueLoading}
                className="rounded-full bg-[var(--accent-strong)] px-5 py-2 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
              >
                {issueLoading ? "Submitting..." : "Create GitHub issue"}
              </button>
            </form>

            {issueMessage && (
              <p className="mt-3 rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--foreground)]">
                {issueMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
