import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tab<Value extends string> = {
  value: Value;
  label: string;
};

type PanelTab<Value extends string> = Tab<Value> & {
  content: ReactNode;
  keepMounted?: boolean;
};

type LinkTab<Value extends string> = Tab<Value> & {
  href: string;
  shortLabel?: string;
};

type TabsProps<Value extends string> = {
  label: string;
  value: Value;
} & (
  | { tabs: readonly PanelTab<Value>[]; onValueChange: (value: Value) => void }
  | { links: readonly LinkTab<Value>[]; children?: ReactNode }
);

const listClassName =
  "flex min-w-0 shrink-0 border-b border-[var(--control-border)]";

function tabClassName(active: boolean) {
  return cn(
    "flex min-h-11 flex-1 items-center justify-center border-b-2 border-transparent px-3 text-[13px] font-semibold whitespace-nowrap text-[var(--ink-muted)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--oxblood)]",
    active && "border-[var(--oxblood)] text-[var(--oxblood)]",
  );
}

export function Tabs<Value extends string>(props: TabsProps<Value>) {
  const { label, value } = props;
  if ("links" in props) {
    return (
      <nav aria-label={label} className={listClassName}>
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {props.links.map((link) => (
            <Link
              key={link.value}
              href={link.href}
              aria-current={link.value === value ? "page" : undefined}
              className={tabClassName(link.value === value)}
            >
              {link.shortLabel && (
                <span aria-hidden="true" className="sm:hidden">
                  {link.shortLabel}
                </span>
              )}
              <span
                className={
                  link.shortLabel ? "sr-only sm:not-sr-only" : undefined
                }
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>
        {props.children}
      </nav>
    );
  }

  const { tabs, onValueChange } = props;
  return (
    <BaseTabs.Root
      className="flex min-h-0 flex-1 flex-col"
      value={value}
      onValueChange={onValueChange}
    >
      <BaseTabs.List
        aria-label={label}
        activateOnFocus
        className={listClassName}
      >
        {tabs.map((tab) => (
          <BaseTabs.Tab
            key={tab.value}
            value={tab.value}
            className={tabClassName(tab.value === value)}
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
