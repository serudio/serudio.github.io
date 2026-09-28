import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { THEME_SETTINGS, useThemeMode, type ThemeSetting } from "../theme-mode";

const ICONS: Record<ThemeSetting, ComponentType<{ fontSize?: "small" }>> = {
  system: SettingsBrightnessOutlinedIcon,
  light: LightModeOutlinedIcon,
  dark: DarkModeOutlinedIcon,
};

/**
 * Explicit theme override, sitting beside <LanguageSwitcher /> and
 * behaving the same way: 'system' follows the OS, and any other choice is
 * remembered in localStorage and wins from then on.
 *
 * Icons rather than labels — three words of theme copy next to two of
 * language copy would crowd the header on a phone. Each still carries its
 * translated name as a tooltip and an aria-label.
 */
export default function ThemeModeSwitcher() {
  const { t } = useTranslation();
  const { setting, setSetting } = useThemeMode();

  return (
    <ToggleButtonGroup
      value={setting}
      exclusive
      size="small"
      onChange={(_, next: ThemeSetting | null) => {
        if (next) setSetting(next);
      }}
    >
      {THEME_SETTINGS.map((value) => {
        const Icon = ICONS[value];
        const label = t(`theme.${value}`);

        return (
          <Tooltip key={value} title={label}>
            <ToggleButton
              value={value}
              aria-label={label}
              sx={{ px: 1, py: 0.25, lineHeight: 1.5 }}
            >
              <Icon fontSize="small" />
            </ToggleButton>
          </Tooltip>
        );
      })}
    </ToggleButtonGroup>
  );
}
