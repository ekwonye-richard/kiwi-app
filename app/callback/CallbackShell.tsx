"use client";

import { useEffect, type ReactNode } from "react";

type CallbackShellProps = {
  children: ReactNode;
};

const CallbackShell = ({ children }: CallbackShellProps) => {
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", "/callback");
    }
  }, []);

  return <>{children}</>;
};

export default CallbackShell;
