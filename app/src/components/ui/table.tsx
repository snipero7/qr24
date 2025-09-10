import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("min-w-full text-sm", className)} {...props} />;
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <thead {...props} /> }
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) { return <tbody {...props} /> }
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn("border-b", props.className)} {...props} /> }
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className={cn("p-2 text-left", className)} {...props} /> }
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn("p-2", className)} {...props} /> }

