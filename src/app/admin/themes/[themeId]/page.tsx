"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemePreview, ThemePreviewMini } from "@/components/admin/ThemePreview";
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
import { QuizTheme, DEFAULT_THEME } from "@/types/theme";
import { parseTheme, validateThemeJson, stringifyTheme } from "@/lib/theme";
import { THEME_PRESETS, PRESET_LIST } from "@/lib/theme-presets";
import { generateAIPrompt, ThemeWizardAnswers } from "@/lib/theme-template";
import {
  ArrowLeft,
  Palette,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Trash2,
  Wand2,
} from "lucide-react";

interface Props {
  params: { themeId: string };
}

type TabType = "presets" | "wizard" | "json";

const BUILTIN_THEMES: Record<string, QuizTheme> = {
  default: DEFAULT_THEME,
  ...THEME_PRESETS,
};

function findBuiltinThemeId(themeJson: string | null | undefined): string | null {
  if (!themeJson) return null;

  try {
    const parsed = JSON.parse(themeJson);
    const normalized = JSON.stringify(parsed);

    for (const [key, theme] of Object.entries(BUILTIN_THEMES)) {
      if (JSON.stringify(theme) === normalized) {
        return key;
      }
    }
  } catch {
    // Ignore parsing errors here; the main validation handles user feedback.
  }

  return null;
}

export default function ThemeBuilderPage({ params }: Props) {
  const { themeId } = params;
  const router = useRouter();
  const isNew = themeId === "new";

  const [themeJson, setThemeJson] = useState("");
  const [description, setDescription] = useState("");
  const [previewTheme, setPreviewTheme] = useState<QuizTheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("presets");
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [wizardAnswers, setWizardAnswers] = useState<ThemeWizardAnswers>({
    topic: "",
    mood: "",
    colors: "",
    backgroundAnimation: "",
    celebration: "",
  });

  useEffect(() => {
    async function loadTheme() {
      try {
        const res = await fetch(`/api/themes/${themeId}`);
        if (!res.ok) {
          setError("Тема не найдена");
          return;
        }

        const data = await res.json();
        const t = data.theme;
        setThemeJson(t.theme);
        setDescription(t.description || "");
        const parsed = parseTheme(t.theme);
        setPreviewTheme(parsed);
        setSelectedPresetId(findBuiltinThemeId(t.theme));
      } catch (err) {
        console.error("Failed to load theme:", err);
        setError("Не удалось загрузить тему");
      } finally {
        setLoading(false);
      }
    }

    if (!isNew) {
      loadTheme();
    } else {
      setPreviewTheme(null);
    }
  }, [isNew, themeId]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setHasOpenaiKey(!!data.hasOpenaiApiKey);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    loadSettings();
  }, []);

  const handleJsonChange = (value: string) => {
    setThemeJson(value);
    setError(null);
    setGenerationError(null);
    setSelectedPresetId(findBuiltinThemeId(value));

    if (!value.trim()) {
      setPreviewTheme(null);
      return;
    }

    const validationError = validateThemeJson(value);
    if (validationError) {
      setError(validationError);
    } else {
      const parsed = parseTheme(value);
      setPreviewTheme(parsed);
    }
  };

  const selectPreset = (presetId: string) => {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
      const json = stringifyTheme(preset);
      setThemeJson(json);
      setPreviewTheme(preset);
      setError(null);
      setGenerationError(null);
      setSelectedPresetId(presetId);
    }
  };

  const copyAIPrompt = async () => {
    const prompt = generateAIPrompt(wizardAnswers);
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTheme = async () => {
    setGenerationError(null);
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch(`/api/themes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: wizardAnswers }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGenerationError(data.error || "Не удалось сгенерировать тему");
        return;
      }

      const generatedJson = data.theme as string;
      const parsed = data.parsedTheme || parseTheme(generatedJson);

      setThemeJson(generatedJson);
      setPreviewTheme(parsed);
      setSelectedPresetId(null);
      setActiveTab("json");
    } catch (err) {
      console.error("Failed to generate theme:", err);
      setGenerationError("Не удалось сгенерировать тему");
    } finally {
      setGenerating(false);
    }
  };

  const saveDisabled = saving || !!error || !themeJson.trim() || !!selectedPresetId;

  const saveTheme = async () => {
    if (saveDisabled) return;

    setSaving(true);
    setError(null);

    try {
      const endpoint = isNew ? "/api/themes" : `/api/themes/${themeId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeJson,
          description,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/admin/themes");
      } else {
        setError(data.error || "Не удалось сохранить тему");
      }
    } catch (err) {
      console.error("Failed to save theme:", err);
      setError("Не удалось сохранить тему");
    } finally {
      setSaving(false);
    }
  };

  const deleteTheme = async () => {
    if (isNew) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/themes/${themeId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/themes");
      }
    } catch (err) {
      console.error("Failed to delete theme:", err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/themes"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {isNew ? "Создать тему" : "Редактирование темы"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isNew ? "Используйте мастер ИИ, встроенные темы или JSON-редактор, чтобы собрать тему" : "Используйте мастер ИИ, встроенные темы или JSON-редактор, чтобы обновить тему"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              {!isNew && (
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
              )}
              <Button onClick={saveTheme} disabled={saveDisabled}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Сохранить тему
              </Button>
            </div>
            {selectedPresetId && (
              <p className="text-xs text-muted-foreground">
                Встроенные темы нельзя сохранить как есть — сначала измените тему или сгенерируйте свою через мастер ИИ.
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Параметры темы</CardTitle>
                <CardDescription>Описание для библиотеки тем</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="theme-description">Описание</Label>
                <Input
                  id="theme-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание темы"
                />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant={activeTab === "presets" ? "default" : "outline"}
                onClick={() => setActiveTab("presets")}
                size="sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Встроенные темы
              </Button>
              <Button
                variant={activeTab === "wizard" ? "default" : "outline"}
                onClick={() => setActiveTab("wizard")}
                size="sm"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Мастер ИИ
              </Button>
              <Button
                variant={activeTab === "json" ? "default" : "outline"}
                onClick={() => setActiveTab("json")}
                size="sm"
              >
                JSON темы
              </Button>
            </div>

            {activeTab === "presets" && (
              <Card>
                <CardHeader>
                  <CardTitle>Встроенные темы</CardTitle>
                  <CardDescription>Выберите встроенную тему как отправную точку</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setThemeJson(stringifyTheme(DEFAULT_THEME));
                        setPreviewTheme(DEFAULT_THEME);
                        setError(null);
                        setGenerationError(null);
                        setSelectedPresetId("default");
                      }}
                      className="text-left p-3 rounded-lg border hover:border-primary transition-colors"
                    >
                      <ThemePreviewMini theme={DEFAULT_THEME} />
                      <p className="font-medium mt-2">Тема по умолчанию</p>
                      <p className="text-xs text-muted-foreground">
                        Базовое оформление приложения
                      </p>
                    </button>

                    {PRESET_LIST.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset.id)}
                        className="text-left p-3 rounded-lg border hover:border-primary transition-colors"
                      >
                        <ThemePreviewMini theme={THEME_PRESETS[preset.id]} />
                        <p className="font-medium mt-2">{preset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "wizard" && (
              <Card>
                <CardHeader>
                  <CardTitle>Мастер ИИ</CardTitle>
                  <CardDescription>
                    Ответьте на несколько вопросов, чтобы сгенерировать тему автоматически. Если ключа OpenAI нет, можно скопировать промпт и сгенерировать тему вручную.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">О чем ваш квиз?</Label>
                    <Input
                      id="topic"
                      placeholder="Например: новогодний квиз, научная викторина, киновечер"
                      value={wizardAnswers.topic}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, topic: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mood">Какое настроение у темы?</Label>
                    <Input
                      id="mood"
                      placeholder="Например: яркое и веселое, строгое, мистическое, праздничное"
                      value={wizardAnswers.mood}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, mood: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colors">Предпочтительные цвета (необязательно)</Label>
                    <Input
                      id="colors"
                      placeholder="Например: сине-зеленая палитра, теплый закат, неон"
                      value={wizardAnswers.colors}
                      onChange={(e) =>
                        setWizardAnswers({ ...wizardAnswers, colors: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background">Анимация фона</Label>
                    <Input
                      id="background"
                      placeholder="Например: падающий снег, мерцающие звезды, пузырьки, без анимации"
                      value={wizardAnswers.backgroundAnimation}
                      onChange={(e) =>
                        setWizardAnswers({
                          ...wizardAnswers,
                          backgroundAnimation: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="celebration">Эффект победы</Label>
                    <Input
                      id="celebration"
                      placeholder="Например: конфетти, искры, фейерверк, мягкое свечение"
                      value={wizardAnswers.celebration}
                      onChange={(e) =>
                        setWizardAnswers({
                          ...wizardAnswers,
                          celebration: e.target.value,
                        })
                      }
                    />
                  </div>

                  {hasOpenaiKey ? (
                    <>
                      <Button
                        onClick={generateTheme}
                        disabled={!wizardAnswers.topic || !wizardAnswers.mood || generating}
                        className="w-full"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Генерируем тему...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Сгенерировать тему через ИИ
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Используется OpenAI API ключ из настроек.
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={copyAIPrompt}
                        disabled={!wizardAnswers.topic || !wizardAnswers.mood}
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Скопировано!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Скопировать промпт для ИИ
                          </>
                        )}
                      </Button>

                      <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t">
                        <p className="font-medium">Что делать дальше:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Нажмите «Скопировать промпт для ИИ»</li>
                          <li>Вставьте его в ChatGPT, Claude или другой ИИ</li>
                          <li>Скопируйте JSON-ответ</li>
                          <li>Перейдите на вкладку JSON и вставьте его туда</li>
                        </ol>
                        <p className="text-xs">
                          Подсказка: добавьте OpenAI API ключ в настройках, чтобы генерировать темы автоматически.
                        </p>
                      </div>
                    </>
                  )}

                  {generationError && (
                    <p className="text-sm text-destructive">{generationError}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "json" && (
              <Card>
                <CardHeader>
                  <CardTitle>JSON темы</CardTitle>
                  <CardDescription>
                    Вставьте JSON темы (из ИИ или после ручного редактирования)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={themeJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Вставьте JSON темы..."
                    className="font-mono text-sm min-h-[400px]"
                  />
                  {error && (
                    <p className="text-sm text-destructive">Ошибка валидации JSON: {error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Предпросмотр темы</h2>
            <ThemePreview theme={previewTheme} />
            <p className="text-sm text-muted-foreground">
              {previewTheme
                ? `Предпросмотр: ${previewTheme.name}`
                : "Используется тема по умолчанию"}
            </p>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тему?</AlertDialogTitle>
            <AlertDialogDescription>
              Тема будет удалена из библиотеки без возможности восстановления. Во всех квизах, где она использовалась,
              автоматически применится тема по умолчанию.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTheme}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаляем...
                </>
              ) : (
                "Удалить тему"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
