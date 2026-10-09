# ==============================================================================
# Local HTTP Test Server for Virtual University LMS Cover Page (PowerShell)
# No external dependencies required (runs natively on Windows using .NET)
# ==============================================================================

param(
    [int]$Port = 8080
)

$HostIP = "localhost"
$Url = "http://${HostIP}:${Port}/"
$Folder = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor DarkRed
Write-Host "  Virtual University LMS - Local Test Server" -ForegroundColor Red
Write-Host "==========================================================" -ForegroundColor DarkRed
Write-Host "Target Directory : $Folder" -ForegroundColor Gray
Write-Host "Starting server on: $Url" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor Yellow

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Url)

try {
    $Listener.Start()
} catch {
    Write-Warning "Could not start on port $Port. Trying port 3000..."
    $Port = 3000
    $Url = "http://${HostIP}:${Port}/"
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add($Url)
    $Listener.Start()
}

# Open the site in the default browser automatically
Start-Process $Url

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $RawPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($RawPath)) {
            $RawPath = "index.html"
        }

        $FilePath = Join-Path $Folder $RawPath

        if (Test-Path $FilePath -PathType Leaf) {
            $Content = [System.IO.File]::ReadAllBytes($FilePath)

            # Determine Content Type
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = switch ($Ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Content.Length
            $Response.OutputStream.Write($Content, 0, $Content.Length)
        } else {
            $Response.StatusCode = 404
            $Buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        }

        $Response.OutputStream.Close()
    } catch {
        # Catch errors on server stop / Ctrl+C
        break
    }
}

$Listener.Stop()
Write-Host "`nServer stopped." -ForegroundColor Red
