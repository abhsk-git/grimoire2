"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Realm = "default" | "shadow" | "void" | "celestial" | "forest" | "sakura";

interface RealmContextValue {
  realm: Realm;
  setRealm: (r: Realm) => void;
}

const RealmContext = createContext<RealmContextValue>({
  realm: "default",
  setRealm: () => {},
});

export function RealmProvider({ children }: { children: React.ReactNode }) {
  const [realm, setRealmState] = useState<Realm>("default");

  useEffect(() => {
    const saved = localStorage.getItem("grimoire-realm") as Realm | null;
    if (saved) setRealmState(saved);
  }, []);

  function setRealm(r: Realm) {
    setRealmState(r);
    localStorage.setItem("grimoire-realm", r);
    if (r === "default") {
      document.documentElement.removeAttribute("data-realm");
    } else {
      document.documentElement.setAttribute("data-realm", r);
    }
  }

  return (
    <RealmContext.Provider value={{ realm, setRealm }}>
      {children}
    </RealmContext.Provider>
  );
}

export function useRealm() {
  return useContext(RealmContext);
}
