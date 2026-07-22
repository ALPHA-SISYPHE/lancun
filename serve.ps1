# 本地预览澜存站点（ES module / 纹理需 HTTP，file:// 在部分浏览器会受限）
$Port = 8080
Set-Location -LiteralPath $PSScriptRoot

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  Write-Host "端口 $Port 已被占用，正在释放..."
  $listeners | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 1
}

Write-Host "澜存本地服务器: http://127.0.0.1:$Port/index.html"
Write-Host "按 Ctrl+C 停止"
npx --yes serve . -l $Port --no-port-switching
