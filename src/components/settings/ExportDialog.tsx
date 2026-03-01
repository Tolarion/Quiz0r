"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { calculatePasswordStrength } from "@/lib/password-strength";
import {
  exportSettingsToFile,
  generateExportFilename,
  downloadFile,
} from "@/lib/settings-export";
import { isCryptoAvailable } from "@/lib/crypto-utils";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Record<string, string>;
  onExportSuccess?: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  settings,
  onExportSuccess,
}: ExportDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cryptoAvailable, setCryptoAvailable] = useState(true);

  useEffect(() => {
    if (open) {
      setCryptoAvailable(isCryptoAvailable());
    }
  }, [open]);

  const strength = calculatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canExport = strength.isValid && passwordsMatch && cryptoAvailable;

  const handleExport = async () => {
    if (!canExport) return;

    setExporting(true);
    try {
      const exportFile = await exportSettingsToFile(settings, password);
      downloadFile(exportFile, generateExportFilename());

      toast.success("Настройки успешно экспортированы!", {
        description: `${exportFile.metadata.settingsCount} настроек зашифровано и загружено`,
      });

      onExportSuccess?.();

      // Reset and close
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Ошибка экспорта", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Экспорт настроек</DialogTitle>
          <DialogDescription>
            Ваши настройки будут зашифрованы паролем. Этот пароль понадобится
            для последующего импорта настроек.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Crypto Not Available Warning */}
          {!cryptoAvailable && (
            <div className="flex gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-100">
                <p className="font-semibold mb-1">Шифрование недоступно</p>
                <p className="text-red-800 dark:text-red-200">
                  Web Crypto API недоступен. Убедитесь, что вы открыли эту
                  страницу по HTTPS или на localhost. Экспорт отключён, пока
                  проблема не будет устранена.
                </p>
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль для шифрования"
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {password && <PasswordStrengthIndicator strength={strength} />}
          </div>

          {/* Confirm Password */}
          {password && strength.isValid && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторно введите пароль"
                autoComplete="new-password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">
                  Пароли не совпадают
                </p>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-semibold mb-1">
                Важно: храните пароль в безопасном месте
              </p>
              <p className="text-amber-800 dark:text-amber-200">
                Если вы потеряете пароль, расшифровать файл экспорта будет
                невозможно. Восстановление пароля не предусмотрено.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Отмена
          </Button>
          <Button onClick={handleExport} disabled={!canExport || exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Экспорт...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Экспорт настроек
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
