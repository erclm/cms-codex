import { render, screen } from "@testing-library/react";
import { act } from "react";
import Home from "@/app/page";
import type { Event, Product, Theme } from "@/lib/types";

type MockData = {
  products: Product[];
  events: Event[];
  themes: Pick<Theme, "id" | "title" | "status" | "enabled" | "updated_at">[];
};

let mockData: MockData;

const createQuery = <Row,>(rows: Row[]) => {
  const query = {
    eq() {
      return query;
    },
    order() {
      return query;
    },
    limit() {
      return query;
    },
    then(
      resolve: (value: { data: Row[] }) => void,
      reject?: (reason?: unknown) => void
    ) {
      try {
        return Promise.resolve(resolve({ data: rows }));
      } catch (error) {
        if (reject) {
          return Promise.reject(reject(error));
        }
        return Promise.reject(error);
      }
    },
  };

  return {
    select: () => query,
  };
};

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: () => ({
    from: (table: string) => {
      if (!(table in mockData)) {
        throw new Error(`Unexpected table ${table}`);
      }
      return createQuery(
        mockData[
          table as keyof Pick<MockData, "products" | "events" | "themes">
        ]
      );
    },
  }),
}));

const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  }),
}));

const baseProduct: Product = {
  id: "prod-1",
  name: "Giftable mug",
  slug: "giftable-mug",
  price_cents: 2800,
  status: "published",
  summary: "Stoneware mug",
  description: null,
  image_url: null,
  created_at: null,
  updated_at: null,
};

async function renderHome() {
  let utils: ReturnType<typeof render> | undefined;
  await act(async () => {
    utils = render(await Home());
  });
  return utils!;
}

describe("Home theme toggle", () => {
  beforeEach(() => {
    mockData = { products: [baseProduct], events: [], themes: [] };
    getSessionMock.mockResolvedValue({ data: { session: null } });
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    signOutMock.mockReset();
  });

  it("renders the base storefront when no ready theme is enabled", async () => {
    const { container } = await renderHome();
    const main = container.querySelector("main");
    expect(main?.getAttribute("data-theme")).toBeNull();
    expect(
      screen.getByText(/Night Market Supply — a one-page storefront/i)
    ).toBeInTheDocument();
  });

  it("applies the theme flag when a ready theme is enabled", async () => {
    mockData.themes = [
      {
        id: "theme-1",
        title: "Merry Christmas",
        status: "ready",
        enabled: true,
        updated_at: "2025-12-01T00:00:00Z",
      },
    ];

    const { container } = await renderHome();
    const main = container.querySelector("main");
    expect(main?.getAttribute("data-theme")).toBe("merry-christmas");
    expect(
      screen.getByText(
        /Merry Market Supply — a cozy gifting storefront powered by Codex/i
      )
    ).toBeInTheDocument();
  });
});
