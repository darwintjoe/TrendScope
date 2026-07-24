"use client";

import { useState } from "react";
import { INDICATOR_REGISTRY } from "@/lib/indicators";
import { IndicatorParams } from "@/lib/provider/types";

interface IndicatorSettingsProps {
  params: Record<string, IndicatorParams>;
  onChange: (name: string, params: IndicatorParams) => void;
}

export function IndicatorSettings({ params, onChange }: IndicatorSettingsProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const update = (name: string, key: string, val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    const current = params[name] ?? INDICATOR_REGISTRY.find((r) => r.name === name)?.defaultParams ?? {};
    onChange(name, { ...current, [key]: num });
  };

  return (
    <div className="border border-zinc-700 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/50 flex items-center gap-2"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Indicator Settings
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1">
          {INDICATOR_REGISTRY.map((reg) => {
            const current = params[reg.name] ?? reg.defaultParams;
            const isExpanded = expanded === reg.name;

            return (
              <div key={reg.name} className="border-t border-zinc-800 pt-1">
                <button
                  onClick={() => setExpanded(isExpanded ? null : reg.name)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                >
                  <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                  {reg.name}
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-2 mt-1 ml-3">
                    {Object.entries(reg.defaultParams).map(([key, defVal]) => (
                      <label key={key} className="flex items-center gap-1 text-xs text-zinc-500">
                        <span className="w-24 truncate">{key}</span>
                        <input
                          type="number"
                          value={current[key] ?? defVal}
                          onChange={(e) => update(reg.name, key, e.target.value)}
                          className="w-16 bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-200 text-xs"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
