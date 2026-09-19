# Funnel: your PC → SSH :22 → VPS 127.0.0.1:5436 → ezwallet-postgres
# Then DBeaver connects to localhost:5436 (see comments below).
param(
  [string]$VpsHost = "2.24.99.211",
  [string]$VpsUser = "root",
  [int]$LocalPort = 5436,
  [int]$RemotePort = 5436
)

Write-Host "Túnel SSH $LocalPort → ${VpsUser}@${VpsHost}:127.0.0.1:$RemotePort"
Write-Host "Deixe esta janela aberta. No DBeaver:"
Write-Host "  Host: 127.0.0.1"
Write-Host "  Port: $LocalPort"
Write-Host "  Database: ezwallet"
Write-Host "  User: valor de POSTGRES_APP_USER no .env do VPS"
Write-Host "  Password: valor de POSTGRES_APP_PASSWORD no .env do VPS"
Write-Host ""

ssh -N -L "${LocalPort}:127.0.0.1:${RemotePort}" "${VpsUser}@${VpsHost}"
