$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$workspaceNode=Join-Path (Split-Path (Get-Location).Path -Parent) '.windows-tools\node-v24.19.0-win-x64'
if(Test-Path (Join-Path $workspaceNode 'node.exe')){$env:PATH="$workspaceNode;$env:PATH"}
npm.cmd run dev -- --port 5174
