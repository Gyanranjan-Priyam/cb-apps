"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

export function ThemeSelectorDropdown() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (mode: ThemeMode) => {
    let targetIsDark = false;

    if (mode === "system") {
      targetIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      targetIsDark = mode === "dark";
    }

    if (targetIsDark) {
      document.documentElement.classList.add("dark");
      setResolvedMode("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setResolvedMode("light");
    }
  };

  useEffect(() => {
    setMounted(true);

    const savedMode = (localStorage.getItem("app_theme_mode") as ThemeMode) || "system";
    setThemeMode(savedMode);
    applyTheme(savedMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if ((localStorage.getItem("app_theme_mode") || "system") === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const selectMode = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    localStorage.setItem("app_theme_mode", newMode);
    applyTheme(newMode);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer" title="Toggle Theme">
          {resolvedMode === "dark" ? (
            <Moon className="h-4 w-4 text-amber-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme Mode</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => selectMode("light")}
          className="flex items-center justify-between cursor-pointer text-xs"
        >
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" /> Light Mode
          </span>
          {themeMode === "light" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => selectMode("dark")}
          className="flex items-center justify-between cursor-pointer text-xs"
        >
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-400" /> Dark Mode
          </span>
          {themeMode === "dark" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => selectMode("system")}
          className="flex items-center justify-between cursor-pointer text-xs"
        >
          <span className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-muted-foreground" /> System Default
          </span>
          {themeMode === "system" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
