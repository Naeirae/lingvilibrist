$ErrorActionPreference = 'Stop'
$HostName = 'com.lingvilibrist.local_nlp'
$ChromeKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
$ManifestPath = Join-Path $env:LOCALAPPDATA "Lingvilibrist\native-host\$HostName.json"

if (Test-Path -LiteralPath $ChromeKey) {
  Remove-Item -LiteralPath $ChromeKey -Recurse -Force
}
if (Test-Path -LiteralPath $ManifestPath) {
  Remove-Item -LiteralPath $ManifestPath -Force
}

Write-Host "Removed $HostName registration for the current user."
