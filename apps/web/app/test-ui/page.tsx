"use client";

import { UIButton, UICard, UICardHeader, UICardTitle, UICardContent } from "@lyra/ui";

export default function TestUIPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">@lyra/ui Package Test</h1>
      
      <UICard>
        <UICardHeader>
          <UICardTitle>Test Card from @lyra/ui</UICardTitle>
        </UICardHeader>
        <UICardContent>
          <p className="text-muted-foreground mb-4">
            This card is imported from the @lyra/ui package.
          </p>
          <div className="flex gap-2">
            <UIButton variant="default">Default Button</UIButton>
            <UIButton variant="secondary">Secondary</UIButton>
            <UIButton variant="destructive">Destructive</UIButton>
            <UIButton variant="outline">Outline</UIButton>
          </div>
        </UICardContent>
      </UICard>
    </div>
  );
}

