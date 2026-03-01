"use client";

import { Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PlayerAdmissionCardProps {
  autoAdmit: boolean;
  onUpdateAutoAdmit: (value: boolean) => void;
}

export function PlayerAdmissionCard({
  autoAdmit,
  onUpdateAutoAdmit,
}: PlayerAdmissionCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="w-4 h-4" />
        Допуск игроков
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5 flex-1">
          <Label htmlFor="auto-admit" className="text-sm font-normal">
            Автодопуск игроков
          </Label>
          <p className="text-xs text-muted-foreground">
            {autoAdmit
              ? "Игроки подключаются автоматически"
              : "Требуется одобрение ведущего"}
          </p>
        </div>
        <Switch
          id="auto-admit"
          checked={autoAdmit}
          onCheckedChange={onUpdateAutoAdmit}
        />
      </div>
    </div>
  );
}
