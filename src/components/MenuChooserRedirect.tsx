"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./providers";

/** On /menu: if the visitor has already picked a shop, open that shop's menu instead of the chooser. */
export default function MenuChooserRedirect() {
  const { id, chosen, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (ready && chosen) router.replace(`/menu/${id}/`);
  }, [ready, chosen, id, router]);
  return null;
}
