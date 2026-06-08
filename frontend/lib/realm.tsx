"use client";

export type Realm = string;

export function RealmProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useRealm() {
  return { realm: "default" as Realm, setRealm: (_: Realm) => {} };
}
