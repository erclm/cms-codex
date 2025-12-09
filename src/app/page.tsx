import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { Event, Product } from "@/lib/types";

async function loadContent() {
  const supabase = getSupabaseServerClient();

  const [{ data: products }, { data: events }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
  ]);

  return {
    products: products ?? [],
    events: events ?? [],
  };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);

export default async function Home() {
  const { products, events } = await loadContent();

  return (
    <main className="flex flex-col gap-12">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg shadow-black/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Codex CMS demo
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Build and launch storefront updates without leaving the dashboard.
            </h1>
            <p className="text-lg text-[var(--muted)]">
              Supabase-powered products and events with a gated admin, plus a
              Codex-triggered GitHub Action to propose new themes via PR.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              Go to admin
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Products
            </p>
            <h2 className="text-2xl font-semibold">Featured drops</h2>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Manage catalog
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
            No products yet. Add one from the admin area.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: Product) => (
              <article
                key={product.id}
                className="group rounded-2xl border border-[var(--border)] bg-gradient-to-br from-white/5 via-[var(--card)] to-black/20 p-5 shadow-md shadow-black/30 transition hover:-translate-y-1 hover:border-[var(--accent)]"
              >
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                  <span>On hand</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[0.65rem] font-semibold text-[var(--accent)]">
                    {product.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {product.summary || "Minimal description pending."}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-semibold">
                    {formatPrice(product.price_cents)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    {product.slug || "new"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Events
            </p>
            <h2 className="text-2xl font-semibold">What&apos;s coming</h2>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Manage events
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
            No events scheduled. Add one from the admin area.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event: Event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md shadow-black/30"
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--muted)]">
                  <span className="text-xs uppercase tracking-[0.25em]">
                    {event.status}
                  </span>
                  {event.starts_at && (
                    <span className="text-xs text-[var(--accent)]">
                      {format(new Date(event.starts_at), "PPp")}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {event.description || "Details coming soon."}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
