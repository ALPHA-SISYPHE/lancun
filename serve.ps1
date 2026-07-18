# 本地预览澜存站点（ES module / 纹理需 HTTP，file:// 在部分浏览器会受限）
$Port = 8080
Set-Location -LiteralPath $PSScriptRoot
Write-Host "澜存本地服务器: http://127.0.0.1:$Port/index.html"
Write-Host "按 Ctrl+C 停止"
python -m http.server $Port
