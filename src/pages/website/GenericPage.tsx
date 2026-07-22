import React from 'react';

export default function GenericPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground text-center max-w-lg">
        This page is currently being updated. Please check back later.
      </p>
    </div>
  );
}
