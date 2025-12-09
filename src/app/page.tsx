/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { format } from "date-fns";
import StorefrontNav from "@/components/storefront-nav";
import AuthOnly from "@/components/auth-only";
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

const defaultHeroHighlight = [
  "Free shipping over $75",
  "45-day returns",
  "Live inventory sync",
];

const festiveHeroHighlight = [
  "Complimentary gift wrap",
  "Extended returns through Jan 15",
  "Next-day sleigh delivery",
];

const enableMerryTheme = true;
const themeFlag = "merry-christmas";

const fallbackProductImages = [
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542293787938-4d36393d5a29?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512499617640-c2f999098c01?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
];
const defaultProductImage =
  "https://images.unsplash.com/photo-1542293787938-4d36393d5a29?auto=format&fit=crop&w=1200&q=80";
const curatedByKeyword: Record<string, string> = {
  tee:
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  shirt:
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  apparel:
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  hoodie:
    "https://images.unsplash.com/photo-1542293787938-4d36393d5a29?auto=format&fit=crop&w=1200&q=80",
  bag: "https://images.unsplash.com/photo-1512499617640-c2f999098c01?auto=format&fit=crop&w=1200&q=80",
  headphones:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  camera:
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
};

const heroHeading = enableMerryTheme
  ? "Merry Market Supply — a cozy gifting storefront powered by Codex + Supabase."
  : "Night Market Supply — a one-page storefront powered by Codex + Supabase.";

const heroDescription = enableMerryTheme
  ? "Cheerful merch, beans, and tech wrapped up for the season. Publish in the admin, let the elves fulfill live inventory, and refresh the vibe with a single theme flag."
  : "Merch, tech, coffee gear, whatever you dream up. Publish in the admin, let customers browse here. Codex can even ship a new theme via GitHub PR.";

const heroHighlight = enableMerryTheme
  ? festiveHeroHighlight
  : defaultHeroHighlight;

const heroCtaLabel = enableMerryTheme
  ? "Shop holiday picks"
  : "Shop the collection";

const stockBadgeLabel = enableMerryTheme ? "North Pole ready" : "In stock";
const addToCartLabel = enableMerryTheme ? "Add to sleigh" : "Add to bag";

const eventsHeading = enableMerryTheme
  ? "Holiday happenings"
  : "In-store happenings";

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);

function getProductImage(product: Product) {
  const keyword = encodeURIComponent(product.slug || product.name || "product");
  const text = (product.slug || product.name || "").toLowerCase();
  const curatedMatch = Object.entries(curatedByKeyword).find(([key]) =>
    text.includes(key)
  );

  const fallback =
    fallbackProductImages[
      hashString(product.slug || product.name || "product") %
        fallbackProductImages.length
    ];
  return (
    product.image_url ||
    curatedMatch?.[1] ||
    fallback ||
    defaultProductImage ||
    `https://source.unsplash.com/800x640/?${keyword},product`
  );
}

export default async function Home() {
  const { products, events } = await loadContent();
  const featuredProducts = products.slice(0, 6);
  const heroProduct = products[0];

  return (
    <main
      data-theme={enableMerryTheme ? themeFlag : undefined}
      className={`flex flex-col gap-10 pb-16 ${
        enableMerryTheme
          ? "relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--background)]/95 shadow-[0_20px_110px_rgba(0,0,0,0.55)] backdrop-blur-md"
          : ""
      }`}
    >
      {enableMerryTheme ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] border border-white/5 bg-[radial-gradient(circle_at_15%_15%,rgba(244,204,93,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(233,61,61,0.14),transparent_28%),radial-gradient(circle_at_60%_70%,rgba(34,197,94,0.12),transparent_30%)]"
        />
      ) : null}
      <StorefrontNav />

      <section
        className={`grid gap-6 rounded-3xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur lg:grid-cols-[1.2fr_0.8fr] ${
          enableMerryTheme ? "festive-hero" : ""
        }`}
      >
        <div className="space-y-5">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-400/30 px-4 py-1 text-xs uppercase tracking-[0.2em] ${
              enableMerryTheme
                ? "festive-ribbon"
                : "bg-emerald-500/10 text-emerald-100"
            }`}
          >
            <span>{enableMerryTheme ? "Holiday shop open" : "New drop"}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                enableMerryTheme
                  ? "bg-white/80 text-[#0c1a26]"
                  : "bg-white/20 text-[#0c1a26]"
              }`}
            >
              {products.length} items
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              {heroHeading}
            </h1>
            <p className="text-lg text-[var(--muted)] sm:max-w-2xl">
              {heroDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="#products"
              className={`rounded-full px-6 py-3 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 ${
                enableMerryTheme
                  ? "festive-button bg-[var(--accent)] text-[#0c0f0b]"
                  : "bg-[var(--accent-strong)]"
              }`}
            >
              {heroCtaLabel}
            </Link>
            {enableMerryTheme ? (
              <Link
                href="#events"
                className="rounded-full border border-[var(--border)] bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Peek at festivities
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {heroHighlight.map((item) => (
              <div
                key={item}
                className={`rounded-full border border-[var(--border)] bg-white/5 px-4 py-2 text-sm text-[var(--muted)] ${
                  enableMerryTheme ? "festive-chip" : ""
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#102436] via-[#0c1928] to-[#08131e] p-4 shadow-xl shadow-black/40 ${
            enableMerryTheme ? "festive-card" : ""
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,241,200,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(74,225,174,0.15),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between rounded-xl bg-black/25 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              <span>{enableMerryTheme ? "Featured gift" : "Featured"}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold text-[var(--accent)]">
                {enableMerryTheme ? "Wrapped today" : "Ready to ship"}
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/5">
              <div className="aspect-[4/3] w-full bg-black/30">
                <img
                  src={
                    heroProduct
                      ? getProductImage(heroProduct)
                      : defaultProductImage
                  }
                  alt={heroProduct ? heroProduct.name : "Featured product"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            {heroProduct ? (
              <div className="mt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{heroProduct.name}</h3>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {heroProduct.summary || "Curated gear ready to ship."}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold">
                    {formatPrice(heroProduct.price_cents)}
                  </span>
                  <Link
                    href="#products"
                    className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
                  >
                    View lineup
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-1">
                <h3 className="text-xl font-semibold">No products yet</h3>
                <p className="text-sm text-[var(--muted)]">
                  Add an item in the admin to showcase it here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="products" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Products
            </p>
            <h2 className="text-3xl font-semibold">
              {enableMerryTheme ? "Fresh from the North Pole" : "Fresh arrivals"}
            </h2>
          </div>
          <AuthOnly>
            <Link
              href="/admin"
              className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Manage catalog
            </Link>
          </AuthOnly>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
            No products yet. Add one from the admin area.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product: Product) => (
              <article
                key={product.id}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md shadow-black/30 transition hover:-translate-y-1 hover:border-[var(--accent)] ${
                  enableMerryTheme ? "festive-card" : ""
                }`}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[4/3] w-full bg-black/20">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div
                    className={`absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)] ${
                      enableMerryTheme ? "festive-label" : ""
                    }`}
                  >
                    {stockBadgeLabel}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <span className="text-sm font-semibold">
                      {formatPrice(product.price_cents)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {product.summary || "Minimal description pending."}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                      {enableMerryTheme ? "Packed with care" : "On hand"}
                    </span>
                    <button className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/30">
                      {addToCartLabel}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div
          className={`rounded-2xl border border-[var(--border)] bg-gradient-to-br from-white/10 via-[var(--card)] to-black/30 p-5 shadow-lg shadow-black/30 ${
            enableMerryTheme ? "festive-subtle" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {enableMerryTheme ? "Gifts ready" : "Merch ready"}
          </p>
          <h3 className="text-xl font-semibold">
            {enableMerryTheme ? "Wrapped & ready" : "Lifestyle ready"}
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {enableMerryTheme
              ? "Scarves, gadgets, beans—swap the catalog and the elves ship it. Add gift notes without touching the code."
              : "Tees, prints, coffee gear, gadgets. Swap the catalog in admin and ship instantly."}
          </p>
        </div>
        <div
          className={`rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#102a1f] via-[#0c1f15] to-[#0a1712] p-5 shadow-lg shadow-black/30 ${
            enableMerryTheme ? "festive-subtle" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Verified
          </p>
          <h3 className="text-xl font-semibold">
            {enableMerryTheme ? "Workshop perks" : "Logged-in perks"}
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {enableMerryTheme
              ? "The admin link appears for trusted helpers only. Sign out from the nav once the list is checked twice."
              : "Authenticated users see the admin dashboard link. Sign out from the nav when you're done."}
          </p>
        </div>
        <div
          className={`rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#142437] via-[#0f1c2c] to-[#0a1622] p-5 shadow-lg shadow-black/30 ${
            enableMerryTheme ? "festive-subtle" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Events ready
          </p>
          <h3 className="text-xl font-semibold">
            {enableMerryTheme ? "Seasonal rhythm" : "Campaign rhythm"}
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {enableMerryTheme
              ? "Publish cocoa tastings, cozy livestreams, or wrap-alongs to keep visitors in the loop."
              : "Publish launch parties, tastings, or livestreams to keep visitors in the loop."}
          </p>
        </div>
      </section>

      <section id="events" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              Events
            </p>
            <h2 className="text-3xl font-semibold">{eventsHeading}</h2>
          </div>
          <AuthOnly>
            <Link
              href="/admin"
              className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Manage events
            </Link>
          </AuthOnly>
        </div>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--muted)]">
            {enableMerryTheme
              ? "No events scheduled yet. Add a cozy gathering from the admin area."
              : "No events scheduled. Add one from the admin area."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event: Event) => (
              <article
                key={event.id}
                className={`flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md shadow-black/30 ${
                  enableMerryTheme ? "festive-card" : ""
                }`}
              >
                {event.starts_at && (
                  <div className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-semibold">
                      {format(new Date(event.starts_at), "PPp")}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {event.description || "Details coming soon."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
