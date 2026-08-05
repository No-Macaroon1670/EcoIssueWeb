# Copies tools/pre-commit into .git/hooks so the data lints actually run.
# .git/hooks is not version-controlled, so this has to be run once per clone.
$repo = Split-Path -Parent $PSScriptRoot
$src = Join-Path $repo 'tools/pre-commit'
$dest = Join-Path $repo '.git/hooks/pre-commit'

if (-not (Test-Path (Join-Path $repo '.git/hooks'))) {
    Write-Error 'No .git/hooks directory — run this from inside a clone.'
    exit 1
}
Copy-Item $src $dest -Force
Write-Host "installed $dest"
Write-Host 'Commits touching any data/*.js now run tools/lint_syntax.py then tools/lint_links.py.'
