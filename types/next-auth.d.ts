import "next-auth";

declare module "next-auth" {
  interface User {
    rank?: string | null;
    crew?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rank?: string | null;
      crew?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rank?: string | null;
    crew?: string | null;
  }
}
