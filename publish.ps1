$ErrorActionPreference = 'Stop'

param(
  [string]$Message = "update"
)

git status --short
git add .

$hasChanges = git diff --cached --name-only
if (-not $hasChanges) {
  Write-Host "Nenhuma mudanca para publicar."
  exit 0
}

git commit -m $Message
git push

Write-Host "Projeto publicado no GitHub com sucesso."
