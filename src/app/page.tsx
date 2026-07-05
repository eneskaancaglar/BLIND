import { Suspense } from "react";
import HomePage from "./HomeClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4">
          <p className="text-neutral-400">Yükleniyor...</p>
        </main>
      }
    >
      <HomePage />
    </Suspense>
  );
}
