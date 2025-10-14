"use client";

import { Button, Card, CardHeader, CardTitle, CardContent } from "@lyra/ui";

export default function TestUIPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">@lyra/ui Package Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Card from @lyra/ui</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This card is imported from the @lyra/ui package.
          </p>
          <div className="flex gap-2">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

