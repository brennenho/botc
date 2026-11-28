"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

type Tab<Value extends string> = {
  value: Value;
  label: string;
  content: ReactNode;
  keepMounted?: boolean;
};

export function Tabs<Value extends string>({
  label,
  tabs,
  value,
  onValueChange,
}: {
  label: string;
  tabs: readonly Tab<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
}) {
  return (
    <BaseTabs.Root
      className="flex min-h-0 flex-1 flex-col"
      value={value}
      onValueChange={onValueChange}
    >
      <BaseTabs.List
        aria-label={label}
        activateOnFocus
        className="flex shrink-0 border-b border-[var(--control-border)]"
      >
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.value}
            value={tab.value}
            className="min-h-11 flex-1 border-b-2 border-transparent px-3 text-[13px] font-semibold text-[var(--ink-muted)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--oxblood)] aria-selected:border-[var(--oxblood)] aria-selected:text-[var(--oxblood)]"
          >
            {tab.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {tabs.map((tab) => (
        <BaseTabs.Panel
          key={tab.value}
          value={tab.value}
          keepMounted={tab.keepMounted}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {tab.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
