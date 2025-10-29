'use client';

import React from 'react';
import { Dashboard } from '@lyra/ui/dist/components';

export default function HomePage() {
  return (
    <div className="px-4 md:px-6 py-6">
      <Dashboard />
    </div>
  );
}

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/test/mureka");
}
