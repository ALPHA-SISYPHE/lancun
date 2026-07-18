Rollback snapshot BEFORE soft-rim / liquid micro-deform work (ocean-bubbles@v37).

Created: 2026-07-18 21:14:11

RESTORE (PowerShell from repo root):
  Copy-Item backups\bubbles-pre-soft-rim\bubbles.js assets\js\globe\bubbles.js -Force
  Copy-Item backups\bubbles-pre-soft-rim\ocean-bubbles.js assets\js\ocean-bubbles.js -Force
  Copy-Item backups\bubbles-pre-soft-rim\shaders\bubble-shaders.js assets\js\globe\shaders\bubble-shaders.js -Force
  Copy-Item backups\bubbles-pre-soft-rim\shaders\bubble.vert assets\js\globe\shaders\bubble.vert -Force
  Copy-Item backups\bubbles-pre-soft-rim\shaders\bubble.frag assets\js\globe\shaders\bubble.frag -Force
  # then set index.html script to ?v=37
