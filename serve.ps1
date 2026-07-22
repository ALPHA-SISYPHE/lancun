# 本地预览澜存站点（ES module / 纹理需 HTTP，file:// 在部分浏览器会受限）
$Port = 8080
$ApiPort = 8788
Set-Location -LiteralPath $PSScriptRoot

foreach ($p in @($Port, $ApiPort)) {
  $listeners = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    Write-Host "端口 $p 已被占用，正在释放..."
    $listeners | ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
  }
}

Write-Host "启动 dev-apis (Coral/OpenAQ 代理): http://127.0.0.1:$ApiPort"
$apiJob = Start-Job -ScriptBlock {
  param($root)
  Set-Location -LiteralPath $root
  node server/dev-apis.mjs
} -ArgumentList $PSScriptRoot

Start-Sleep -Seconds 1

Write-Host "澜存本地服务器: http://127.0.0.1:$Port/index.html"
Write-Host "按 Ctrl+C 停止（将同时停止 dev-apis）"
try {
  npx --yes serve . -l $Port --no-port-switching
} finally {
  Stop-Job $apiJob -ErrorAction SilentlyContinue
  Remove-Job $apiJob -Force -ErrorAction SilentlyContinue
}
