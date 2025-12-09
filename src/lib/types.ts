export type ProductStatus = "draft" | "published";

export type Product = {
  id: string;
  name: string;
  slug: string | null;
  price_cents: number;
  status: ProductStatus;
  summary: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EventStatus = "draft" | "published";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Product>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Event>;
      };
    };
  };
};
