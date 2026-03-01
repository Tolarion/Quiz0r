"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Settings,
  Globe,
  Key,
  Play,
  Square,
  Loader2,
  Check,
  ExternalLink,
  Copy,
  Link2,
  Download,
  Upload,
  AlertTriangle,
  Image,
  Wand2,
} from "lucide-react";
import { ExportDialog } from "@/components/settings/ExportDialog";
import { ImportDialog } from "@/components/settings/ImportDialog";

interface SettingsData {
  ngrokToken: string | null;
  ngrokTokenRaw: string | null;
  hasToken: boolean;
  tunnelRunning: boolean;
  tunnelUrl: string | null;
  shortioApiKey: string | null;
  shortioApiKeyRaw: string | null;
  hasShortioApiKey: boolean;
  shortioDomain: string | null;
  openaiApiKey: string | null;
  openaiApiKeyRaw: string | null;
  hasOpenaiApiKey: boolean;
  unsplashApiKey: string | null;
  unsplashApiKeyRaw: string | null;
  hasUnsplashApiKey: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortioApiKeyInput, setShortioApiKeyInput] = useState("");
  const [shortioDomainInput, setShortioDomainInput] = useState("");
  const [showShortio, setShowShortio] = useState(false);
  const [savingShortio, setSavingShortio] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [openaiApiKeyInput, setOpenaiApiKeyInput] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [savingOpenai, setSavingOpenai] = useState(false);
  const [showRemoveOpenaiDialog, setShowRemoveOpenaiDialog] = useState(false);
  const [unsplashApiKeyInput, setUnsplashApiKeyInput] = useState("");
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [savingUnsplash, setSavingUnsplash] = useState(false);
  const [showRemoveUnsplashDialog, setShowRemoveUnsplashDialog] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [showExportNotice, setShowExportNotice] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [removeTokenDialogOpen, setRemoveTokenDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveToken() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngrokToken: tokenInput }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Токен успешно сохранён!" });
        setTokenInput("");
        setShowToken(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Не удалось сохранить токен" });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось сохранить токен" });
    } finally {
      setSaving(false);
    }
  }

  async function removeToken() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngrokToken: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Токен удалён" });
    fetchSettings();
  }

    } catch {
      setMessage({ type: "error", text: "Не удалось удалить токен" });
    } finally {
      setSaving(false);
      setRemoveTokenDialogOpen(false);
    }
  }

  async function startTunnel() {
    setTunnelLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/tunnel", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Туннель запущен!" });
        fetchSettings();
      } else {
        setMessage({ type: "error", text: data.error || "Не удалось запустить туннель" });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось запустить туннель" });
    } finally {
      setTunnelLoading(false);
    }
  }

  async function stopTunnel() {
    setTunnelLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/tunnel", {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Туннель остановлен" });
        // Clear cached URL from localStorage
        localStorage.removeItem("quiz0r-base-url");
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось остановить туннель" });
    } finally {
      setTunnelLoading(false);
    }
  }

  function copyUrl() {
    if (settings?.tunnelUrl) {
      navigator.clipboard.writeText(settings.tunnelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function saveShortioSettings() {
    setSavingShortio(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortioApiKey: shortioApiKeyInput,
          shortioDomain: shortioDomainInput,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Настройки Short.io успешно сохранены!" });
        setShortioApiKeyInput("");
        setShortioDomainInput("");
        setShowShortio(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Не удалось сохранить настройки Short.io" });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось сохранить настройки Short.io" });
    } finally {
      setSavingShortio(false);
    }
  }

  async function confirmRemoveShortioSettings() {
    setSavingShortio(true);
    setMessage(null);
    setShowRemoveDialog(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortioApiKey: "", shortioDomain: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Настройки Short.io удалены" });
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось удалить настройки Short.io" });
    } finally {
      setSavingShortio(false);
    }
  }

  async function saveOpenaiSettings() {
    setSavingOpenai(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: openaiApiKeyInput,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Ключ API OpenAI успешно сохранён!" });
        setOpenaiApiKeyInput("");
        setShowOpenai(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Не удалось сохранить ключ API OpenAI" });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось сохранить ключ API OpenAI" });
    } finally {
      setSavingOpenai(false);
    }
  }

  async function confirmRemoveOpenaiSettings() {
    setSavingOpenai(true);
    setMessage(null);
    setShowRemoveOpenaiDialog(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Ключ API OpenAI удалён" });
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось удалить ключ API OpenAI" });
    } finally {
      setSavingOpenai(false);
    }
  }

  async function saveUnsplashSettings() {
    setSavingUnsplash(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unsplashApiKey: unsplashApiKeyInput,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Ключ API Unsplash успешно сохранён!" });
        setUnsplashApiKeyInput("");
        setShowUnsplash(false);
        fetchSettings();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Не удалось сохранить ключ API Unsplash" });
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось сохранить ключ API Unsplash" });
    } finally {
      setSavingUnsplash(false);
    }
  }

  async function confirmRemoveUnsplashSettings() {
    setSavingUnsplash(true);
    setMessage(null);
    setShowRemoveUnsplashDialog(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsplashApiKey: "" }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Ключ API Unsplash удалён" });
        fetchSettings();
      }
    } catch {
      setMessage({ type: "error", text: "Не удалось удалить ключ API Unsplash" });
    } finally {
      setSavingUnsplash(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к викторинам
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Настройки
          </h1>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Backup & Restore Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Резервное копирование и восстановление
          </CardTitle>
          <CardDescription>
            Экспортируйте ключи API и настройки в зашифрованный файл для резервного
            копирования или переноса.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт настроек
            </Button>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Импорт настроек
            </Button>
          </div>

          {showExportNotice && (
            <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-900 dark:text-amber-100">
                Файл экспорта зашифрован паролем. Сохраните пароль в надёжном
                месте — восстановить его невозможно.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tunnel Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Внешний туннель
          </CardTitle>
          <CardDescription>
            Включите внешний доступ, чтобы игроки с мобильных устройств могли
            подключаться к викторинам по QR-коду. Получите бесплатный токен
            авторизации ngrok на{" "}
            <a
              href="https://dashboard.ngrok.com/get-started/your-authtoken"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ngrok.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>Токен авторизации ngrok</Label>
            </div>

              {settings?.hasToken ? (
              <div className="flex items-center gap-4">
                <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                  {settings.ngrokToken}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoveTokenDialogOpen(true)}
                  disabled={saving}
                >
                  Удалить
                </Button>
              </div>
            ) : showToken ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Вставьте токен авторизации ngrok..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveToken} disabled={!tokenInput || saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowToken(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowToken(true)}>
                <Key className="w-4 h-4 mr-2" />
                Добавить токен
              </Button>
            )}
          </div>

          {/* Tunnel Status */}
          {settings?.hasToken && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Статус туннеля:</span>
                  {settings.tunnelRunning ? (
                    <Badge className="bg-green-500">Запущен</Badge>
                  ) : (
                    <Badge variant="secondary">Остановлен</Badge>
                  )}
                </div>

                {settings.tunnelRunning ? (
                  <Button
                    variant="outline"
                    onClick={stopTunnel}
                    disabled={tunnelLoading}
                  >
                    {tunnelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    Остановить туннель
                  </Button>
                ) : (
                  <Button onClick={startTunnel} disabled={tunnelLoading}>
                    {tunnelLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Запустить туннель
                  </Button>
                )}
              </div>

              {settings.tunnelUrl && (
                <div className="space-y-2">
                  <Label>Публичный URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm break-all">
                      {settings.tunnelUrl}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyUrl}>
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <a
                      href={settings.tunnelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Этот URL будет использоваться в QR-кодах при запуске игры.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Short.io Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Сокращение URL через Short.io
          </CardTitle>
          <CardDescription>
            Создавайте короткие URL для ссылок подключения, чтобы ими было проще
            делиться. Получите бесплатный ключ API и найдите свой домен на{" "}
            <a
              href="https://app.short.io/settings/integrations/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              short.io
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>Ключ API Short.io</Label>
            </div>

            {settings?.hasShortioApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                    {settings.shortioApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveDialog(true)}
                    disabled={savingShortio}
                  >
                    Удалить
                  </Button>
                </div>
                {settings.shortioDomain && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Домен</Label>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm">
                      {settings.shortioDomain}
                    </code>
                  </div>
                )}
              </div>
            ) : showShortio ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Вставьте ключ API Short.io..."
                    value={shortioApiKeyInput}
                    onChange={(e) => setShortioApiKeyInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Домен (обязательно)</Label>
                  <Input
                    type="text"
                    placeholder="например, link.yourdomain.com"
                    value={shortioDomainInput}
                    onChange={(e) => setShortioDomainInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ваш домен Short.io (можно найти в панели управления Short.io)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveShortioSettings}
                    disabled={!shortioApiKeyInput || !shortioDomainInput || savingShortio}
                  >
                    {savingShortio ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowShortio(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowShortio(true)}>
                <Key className="w-4 h-4 mr-2" />
                Добавить настройки Short.io
              </Button>
            )}
          </div>

          {settings?.hasShortioApiKey && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Короткие URL для ссылок подключения будут создаваться автоматически.
                Если сокращение URL не сработает, будет использован полный URL.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI Translation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            OpenAI
          </CardTitle>
          <CardDescription>
            Используйте OpenAI GPT-4o для генерации викторин, тем, переводов и
            текстов для сертификатов. Получите ключ API на{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              platform.openai.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>Ключ API OpenAI</Label>
            </div>

            {settings?.hasOpenaiApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                    {settings.openaiApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveOpenaiDialog(true)}
                    disabled={savingOpenai}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ) : showOpenai ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Вставьте ключ API OpenAI..."
                    value={openaiApiKeyInput}
                    onChange={(e) => setOpenaiApiKeyInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ключ API хранится безопасно и никогда не передаётся клиентам
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveOpenaiSettings}
                    disabled={!openaiApiKeyInput || savingOpenai}
                  >
                    {savingOpenai ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowOpenai(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowOpenai(true)}>
                <Key className="w-4 h-4 mr-2" />
                Добавить ключ API OpenAI
              </Button>
            )}
          </div>

          {settings?.hasOpenaiApiKey && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                С включённым OpenAI вы сможете автоматически создавать викторины,
                генерировать темы по ответам мастера, переводить викторины на 10+
                языков (испанский, французский, немецкий, иврит, японский,
                китайский, арабский, португальский, русский, итальянский), а также
                создавать AI-поздравления для сертификатов. Игроки смогут выбрать
                предпочитаемый язык при подключении.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unsplash Images Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Изображения Unsplash
          </CardTitle>
          <CardDescription>
            Добавьте ключ доступа Unsplash, чтобы AI-викторины включали реальные
            изображения. Получите ключ на{" "}
            <a
              href="https://unsplash.com/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              unsplash.com/developers
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <Label>Ключ доступа Unsplash</Label>
            </div>

            {settings?.hasUnsplashApiKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                    {settings.unsplashApiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveUnsplashDialog(true)}
                    disabled={savingUnsplash}
                  >
                    Удалить
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  При создании AI-викторин будут подбираться тематические изображения из Unsplash.
                </p>
              </div>
            ) : showUnsplash ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Вставьте ключ доступа Unsplash..."
                    value={unsplashApiKeyInput}
                    onChange={(e) => setUnsplashApiKeyInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ключ хранится безопасно и используется только на сервере для поиска изображений.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={saveUnsplashSettings}
                    disabled={!unsplashApiKeyInput || savingUnsplash}
                  >
                    {savingUnsplash ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowUnsplash(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowUnsplash(true)}>
                <Key className="w-4 h-4 mr-2" />
                Добавить ключ доступа Unsplash
              </Button>
            )}
          </div>

          {settings?.hasUnsplashApiKey && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                При создании AI-викторин изображения будут автоматически добавляться к разделам и многим вопросам.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={removeTokenDialogOpen} onOpenChange={setRemoveTokenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить токен ngrok?</AlertDialogTitle>
            <AlertDialogDescription>
              Внешний туннель будет остановлен, пока вы не добавите новый токен.
              Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeToken}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? "Удаление..." : "Удалить токен"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Short.io Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить настройки Short.io?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить ключ API и домен Short.io?
              Ссылки подключения больше не будут сокращаться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={savingShortio}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveShortioSettings}
              disabled={savingShortio}
            >
              {savingShortio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Удалить настройки"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove OpenAI Confirmation Dialog */}
      <Dialog open={showRemoveOpenaiDialog} onOpenChange={setShowRemoveOpenaiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ключ API OpenAI?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить ключ API OpenAI?
              После этого вы не сможете переводить викторины.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveOpenaiDialog(false)}
              disabled={savingOpenai}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveOpenaiSettings}
              disabled={savingOpenai}
            >
              {savingOpenai ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Удалить ключ API"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Unsplash Confirmation Dialog */}
      <Dialog open={showRemoveUnsplashDialog} onOpenChange={setShowRemoveUnsplashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить ключ доступа Unsplash?</DialogTitle>
            <DialogDescription>
              Если удалить этот ключ, AI-викторины перестанут добавлять изображения Unsplash.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveUnsplashDialog(false)}
              disabled={savingUnsplash}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveUnsplashSettings}
              disabled={savingUnsplash}
            >
              {savingUnsplash ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Удалить ключ API"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export/Import Dialogs */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        settings={{
          ngrok_token: settings?.ngrokTokenRaw || "",
          shortio_api_key: settings?.shortioApiKeyRaw || "",
          shortio_domain: settings?.shortioDomain || "",
          openai_api_key: settings?.openaiApiKeyRaw || "",
          unsplash_api_key: settings?.unsplashApiKeyRaw || "",
        }}
        onExportSuccess={() => setShowExportNotice(true)}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        currentSettings={{
          ngrok_token: settings?.ngrokTokenRaw || "",
          shortio_api_key: settings?.shortioApiKeyRaw || "",
          shortio_domain: settings?.shortioDomain || "",
          openai_api_key: settings?.openaiApiKeyRaw || "",
          unsplash_api_key: settings?.unsplashApiKeyRaw || "",
        }}
        onImportSuccess={() => {
          // Refresh settings after import
          fetchSettings();
        }}
      />
    </div>
  );
}
