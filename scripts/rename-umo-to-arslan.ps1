param(
  [string]$Root = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'

# Track files we failed to write, e.g., locked by another process
$script:FailedWrites = New-Object System.Collections.Generic.List[string]

# Exclusions to avoid breaking third-party or UI text
$excludeRegex = [regex]'(\\node_modules\\|\\dist\\|\\.git\\|\\coverage\\|\\.husky\\|\\.idea\\|\\.vscode\\|\\src\\locales\\)'

# File patterns to edit (include SVG icons for CSS var prefixes)
$patterns = @('*.ts','*.tsx','*.js','*.jsx','*.vue','*.less','*.css','*.d.ts','*.svg','package.json')

function Get-ProjectFiles([string]$base) {
  Get-ChildItem -Path $base -Recurse -File -Include $patterns |
    Where-Object { $_.FullName -notmatch $excludeRegex }
}

function Replace-InFile([string]$filePath, [hashtable]$replacements) {
  $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
  $original = $content

  foreach ($kvp in $replacements.GetEnumerator()) {
    $from = [regex]::Escape($kvp.Key)
    $to = $kvp.Value
    # -replace is case-insensitive; we use escaped literal patterns intentionally
    $content = $content -replace $from, $to
  }

  if ($content -ne $original) {
    if (Write-ContentSafe -filePath $filePath -content $content) { return $true } else { return $false }
  }
  return $false
}

# Safe write with small retry loop to handle transient file locks
function Write-ContentSafe([string]$filePath, [string]$content, [int]$retries = 5, [int]$delayMs = 200) {
  for ($i = 0; $i -le $retries; $i++) {
    try {
      Set-Content -LiteralPath $filePath -Encoding UTF8 -Value $content
      return $true
    } catch {
      if ($i -eq $retries) {
        $script:FailedWrites.Add($filePath)
        Write-Warning "Could not write to '$filePath' after $retries retries: $($_.Exception.Message)"
        return $false
      }
      Start-Sleep -Milliseconds $delayMs
    }
  }
}

# 1) Prefixes, CSS vars, storage keys, and icon IDs
$prefixReplacements = @{
  # Storage keys and explicit tokens first (hyphenated safe target)
  'umo-editor' = 'arslan-editor'
  # Generic class/var prefix (safe due to hyphen)
  'umo-' = 'arslan-'
  # Vite Less prefix config
  "'@prefix': 'umo'" = "'@prefix': 'arslan'"
}

# 2) TypeScript/Vue identifiers (ordered from most specific to generic)
$identifierReplacements = @{
  'UmoEditorOptions'     = 'ArslanEditorOptions'
  'useUmoEditor'         = 'useArslanEditor'
  'UmoEditorComponent'   = 'ArslanEditorComponent'
  'UmoMenuButton'        = 'ArslanMenuButton'
  'UmoTooltip'           = 'ArslanTooltip'
  'UmoDialog'            = 'ArslanDialog'
  'UmoEditor'            = 'ArslanEditor'
}

$files = Get-ProjectFiles -base $Root

$changed1 = 0
foreach ($f in $files) {
  if (Replace-InFile -filePath $f.FullName -replacements $prefixReplacements) { $changed1++ }
}

$changed2 = 0
foreach ($f in $files) {
  # Skip locales again for identifier replacements just to be extra safe
  if ($f.FullName -match $excludeRegex) { continue }
  $content = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  $original = $content
  foreach ($kvp in $identifierReplacements.GetEnumerator()) {
    # Word-boundary, case-sensitive replacement to avoid touching UI strings like 'umoeditor'
    $pattern = "\\b" + [regex]::Escape($kvp.Key) + "\\b"
    $content = $content -creplace $pattern, $kvp.Value
  }
  # Generic PascalCase: UmoXxx -> ArslanXxx
  $content = $content -creplace '\bUmo([A-Z][A-Za-z0-9_]*)\b', 'Arslan$1'
  # LowerCamel identifiers 'umoXxx' -> 'arslanXxx' (only when next char is uppercase)
  # This avoids touching tokens like 'umodoc' and 'umoeditor'
  $content = $content -creplace '(^|[^A-Za-z0-9_])umo(?=[A-Z])', '$1arslan'
  if ($content -ne $original) {
    if (Write-ContentSafe -filePath $f.FullName -content $content) { $changed2++ }
  }
}

Write-Host "Prefix replacements applied to $changed1 files. Identifier replacements applied to $changed2 files." -ForegroundColor Green

# Post-scan for any remaining 'umo' (excluding locales, node_modules, dist, etc.)
$remaining = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch $excludeRegex } |
  Select-String -Pattern 'umo' -SimpleMatch -List -ErrorAction SilentlyContinue |
  Select-Object -First 50

if ($remaining) {
  Write-Warning "Found potential remaining 'umo' references (showing up to 50):"
  $remaining | ForEach-Object { Write-Host ("{0}:{1}: {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()) }
} else {
  Write-Host "No remaining 'umo' found in code (excluding locales and external folders)." -ForegroundColor Green
}

if ($script:FailedWrites.Count -gt 0) {
  Write-Warning "Some files could not be updated because they were locked by another process:"
  $script:FailedWrites | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  Write-Warning "Close processes (e.g., dev servers, formatters) and re-run the script to update these files."
}
