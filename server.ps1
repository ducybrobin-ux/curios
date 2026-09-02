# Serveur web local pour jdp — v2 HTTPS auto-signé
# Usage : powershell -ExecutionPolicy Bypass -File server.ps1 [-Port 8080] [-HttpsPort 8443]
#   Port      (8080) : HTTP -> redirige automatiquement vers HTTPS
#   HttpsPort (8443) : HTTPS (certificat auto-signé) -> GPS + camera autorises
#   -NoHttps         : force le mode HTTP seul (sans certificat)
# Le certificat auto-signé est créé une fois (persistant sur le PC) et sert
# de contexte sécurisé : le navigateur demande l'autorisation pour le GPS et
# l'appareil photo (au 1er accès, accepter l'avertissement de certificat).

param(
  [int]$Port = 8080,
  [int]$HttpsPort = 8443,
  [switch]$NoHttps
)

$Root = $PSScriptRoot
if (-not $Root) { $Root = (Get-Location).Path }

# --- Tableau de bord : état partagé (organisateur <-> participants) ---
# Le serveur est mono-thread : ces variables ne sont jamais écrites en parallèle.
$script:BoardMessage = @{}         # message diffusé aux participants (clés fr/en/nl/de/zh/ja)
$script:BoardSeq = 0               # version du message (incrémentée à chaque changement)
$script:BoardChallenge = $null     # épreuve en cours (JSON sans la réponse)
$script:ChallengeSeq = 0           # version de l'épreuve
$script:Answers = New-Object System.Collections.ArrayList  # réponses des participants
$script:Positions = New-Object System.Collections.ArrayList  # positions GPS des équipes
$script:PositionSeq = 0
$script:Feedback = New-Object System.Collections.ArrayList  # questionnaire testeur (persisté dans data\feedback.json)
try {
    $fbFile = Join-Path $Root 'data\feedback.json'
    if (Test-Path -LiteralPath $fbFile) {
        $loaded = Get-Content -LiteralPath $fbFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($null -ne $loaded) {
            if ($loaded -isnot [System.Array]) { $loaded = @($loaded) }
            foreach ($e in $loaded) { [void]$script:Feedback.Add($e) }
        }
    }
} catch {}
$script:Finishes = New-Object System.Collections.ArrayList  # équipes ayant terminé le parcours (persisté dans data\finishes.json)
try {
    $fiFile = Join-Path $Root 'data\finishes.json'
    if (Test-Path -LiteralPath $fiFile) {
        $loaded = Get-Content -LiteralPath $fiFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($null -ne $loaded) {
            if ($loaded -isnot [System.Array]) { $loaded = @($loaded) }
            foreach ($e in $loaded) { [void]$script:Finishes.Add($e) }
        }
    }
} catch {}
$script:Urgencies = New-Object System.Collections.ArrayList  # alertes Urgence (persisté dans data\urgencies.json)
try {
    $urgFile = Join-Path $Root 'data\urgencies.json'
    if (Test-Path -LiteralPath $urgFile) {
        $loaded = Get-Content -LiteralPath $urgFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($null -ne $loaded) {
            if ($loaded -isnot [System.Array]) { $loaded = @($loaded) }
            foreach ($e in $loaded) { [void]$script:Urgencies.Add($e) }
        }
    }
} catch {}
$script:TranslateCache = @{}      # cache des traductions (clé "lang|texte" -> traduction)
$script:BoardLogout = @{}         # équipes à déconnecter (clé = nom en minuscules) -> horodatage UTC
$script:LogoutSeq = 0             # version des commandes de déconnexion
$script:Validations = @{}         # équipe -> liste d'ids de balises validées (persisté dans data\validations.json)
try {
    $valFile = Join-Path $Root 'data\validations.json'
    if (Test-Path -LiteralPath $valFile) {
        $loaded = Get-Content -LiteralPath $valFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($loaded -is [System.Management.Automation.PSCustomObject]) {
            foreach ($prop in $loaded.PSObject.Properties) {
                $script:Validations[[string]$prop.Name] = @($prop.Value)
            }
        }
    }
} catch {}

# --- Modes d'accès du serveur : Local (Wi-Fi) et Internet (tunnel cloudflared) ---
$script:ServerModeFile = Join-Path $Root 'data\server-mode.json'
$script:ServerMode = @{ local = $true; internet = $false }   # booléens persistés
$script:TunnelStatus = "off"        # off | starting | on | error
$script:TunnelUrl = ""
$script:TunnelError = ""
$script:TunnelProcess = $null
$script:TunnelLog = Join-Path $Root 'data\cloudflared.log'
$script:TunnelLogErr = Join-Path $Root 'data\cloudflared.err.log'
$script:LastTunnelPoll = [datetime]::MinValue
try {
    if (Test-Path -LiteralPath $script:ServerModeFile) {
        $loaded = Get-Content -LiteralPath $script:ServerModeFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($loaded) {
            if ($null -ne $loaded.local) { $script:ServerMode.local = [bool]$loaded.local }
            if ($null -ne $loaded.internet) { $script:ServerMode.internet = [bool]$loaded.internet }
        }
    }
} catch {}

# --- Wi-Fi du site (QR d'accès des familles) ---
$script:WifiFile = Join-Path $Root 'data\wifi.json'
$script:Wifi = @{ ssid = ''; password = ''; security = 'WPA' }
try {
    if (Test-Path -LiteralPath $script:WifiFile) {
        $wloaded = Get-Content -LiteralPath $script:WifiFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($wloaded) {
            if ($null -ne $wloaded.ssid) { $script:Wifi.ssid = [string]$wloaded.ssid }
            if ($null -ne $wloaded.password) { $script:Wifi.password = [string]$wloaded.password }
            if ($null -ne $wloaded.security) { $script:Wifi.security = [string]$wloaded.security }
        }
    }
} catch {}

function Save-Wifi {
    try {
        $dir = Split-Path -Parent $script:WifiFile
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $json = $script:Wifi | ConvertTo-Json -Compress
        if ($json -isnot [string]) { $json = [string]$json }
        [System.IO.File]::WriteAllText($script:WifiFile, $json, (New-Object System.Text.UTF8Encoding $false))
    } catch {}
}

# --- Carte du parcours : URL externe (Google Maps / OpenStreetMap) vue par les participants ---
$script:MapFile = Join-Path $Root 'data\map.json'
$script:MapUrl = ""
try {
    if (Test-Path -LiteralPath $script:MapFile) {
        $mloaded = Get-Content -LiteralPath $script:MapFile -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($mloaded -and $null -ne $mloaded.url) { $script:MapUrl = [string]$mloaded.url }
    }
} catch {}

function Save-Map {
    try {
        $dir = Split-Path -Parent $script:MapFile
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $json = @{ url = $script:MapUrl } | ConvertTo-Json -Compress
        if ($json -isnot [string]) { $json = [string]$json }
        [System.IO.File]::WriteAllText($script:MapFile, $json, (New-Object System.Text.UTF8Encoding $false))
    } catch {}
}

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".mp3"  = "audio/mpeg"
    ".ogg"  = "audio/ogg"
    ".wav"  = "audio/wav"
    ".m4a"  = "audio/mp4"
    ".mp4"  = "video/mp4"
    ".webm" = "video/webm"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".txt"  = "text/plain; charset=utf-8"
    ".md"   = "text/markdown; charset=utf-8"
    ".webmanifest" = "application/manifest+json"
}

function Get-LocalIPv4 {
    # 1) Interface de la route par defaut (le reseau LAN utilise par les telephones)
    try {
        $route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction Stop | Select-Object -First 1
        if ($route) {
            $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $route.ifIndex -ErrorAction Stop |
                  Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254*' } |
                  Select-Object -First 1
            if ($ip) { return $ip.IPAddress }
        }
    } catch {}
    # 2) Secours : n'importe quelle IPv4 locale (sauf VPN/APIPA/loopback)
    try {
        $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
              Where-Object { $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' } |
              Select-Object -First 1
        if ($ip) { return $ip.IPAddress }
    } catch {}
    return "127.0.0.1"
}

function Get-Certificate {
    $subject = "CN=jdp"
    $existing = Get-ChildItem Cert:\CurrentUser\My -ErrorAction SilentlyContinue |
                Where-Object { $_.Subject -eq $subject -and $_.NotAfter -gt (Get-Date) } |
                Sort-Object NotAfter -Descending | Select-Object -First 1
    if ($existing) { return $existing }
    if ($NoHttps) { return $null }
    $ip = Get-LocalIPv4
    try {
        $cert = New-SelfSignedCertificate -Subject $subject `
                -DnsName @("localhost", $ip) `
                -CertStoreLocation Cert:\CurrentUser\My `
                -NotAfter (Get-Date).AddYears(10) `
                -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 `
                -KeyExportPolicy Exportable -ErrorAction Stop
        Write-Host "  Certificat auto-signe cree (valide 10 ans)." -ForegroundColor Green
        return $cert
    } catch {
        Write-Host "  Certificat auto-signe indisponible : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Read-RequestHead([System.Net.Sockets.TcpClient]$Client) {
    $stream = $Client.GetStream()
    $stream.ReadTimeout = 8000
    $buffer = New-Object byte[] 8192
    $builder = New-Object System.Text.StringBuilder
    do {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) { break }
        [void]$builder.Append([System.Text.Encoding]::ASCII.GetString($buffer, 0, $read))
        if ($builder.ToString().Contains("`r`n`r`n")) { break }
    } while ($builder.Length -lt 65536)
    return $builder.ToString()
}

function Send-Response([System.IO.Stream]$Stream, [int]$Status, [string]$StatusText, [string]$Body, [string]$ContentType, [byte[]]$Bytes = $null) {
    try {
        $header = "HTTP/1.1 $Status $StatusText`r`nServer: jdp-server`r`nX-Content-Type-Options: nosniff`r`nCache-Control: no-cache`r`n"
        if ($ContentType) { $header += "Content-Type: $ContentType`r`n" }
        if ($null -eq $Bytes) {
            $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
        }
        $header += "Content-Length: $($Bytes.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $Stream.Write($headerBytes, 0, $headerBytes.Length)
        $Stream.Write($Bytes, 0, $Bytes.Length)
        $Stream.Flush()
    } catch {}
}

function Send-File([System.IO.Stream]$Stream, [string]$Path) {
    try {
        $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
        $mime = $MimeTypes[$ext]
        if (-not $mime) { $mime = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($Path)
        $header = "HTTP/1.1 200 OK`r`nServer: jdp-server`r`nX-Content-Type-Options: nosniff`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $Stream.Write($headerBytes, 0, $headerBytes.Length)
        $Stream.Write($bytes, 0, $bytes.Length)
        $Stream.Flush()
    } catch {}
}

# Traduit un message français vers en/nl/de/zh/ja via une API gratuite (Google gtx,
# repli MyMemory). Si le serveur est hors-ligne, repli sur le texte français.
# Renvoie un hashtable { fr, en, nl, de, zh, ja, ok_en, ok_nl, ok_de, ok_zh, ok_ja }.
function ConvertTo-TeamLanguages([string]$Text) {
    $out = @{ fr = $Text; en = ''; nl = ''; de = ''; zh = ''; ja = ''; ok_en = $false; ok_nl = $false; ok_de = $false; ok_zh = $false; ok_ja = $false }
    $text = [string]$Text
    if ([string]::IsNullOrWhiteSpace($text)) {
        foreach ($k in @('en','nl','de','zh','ja')) { $out[$k] = '' }
        return $out
    }
    $text = $text.Trim()
    if ($text.Length -gt 400) { $text = $text.Substring(0, 400) }
    $apiLang = @{ en = 'en'; nl = 'nl'; de = 'de'; zh = 'zh-CN'; ja = 'ja' }
    $offline = $false
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
    foreach ($k in @('en','nl','de','zh','ja')) {
        if ($offline) { $out[$k] = $text; continue }
        $cacheKey = $k + '|' + $text
        if ($script:TranslateCache.ContainsKey($cacheKey)) {
            $out[$k] = $script:TranslateCache[$cacheKey]
            $out["ok_$k"] = ($script:TranslateCache[$cacheKey] -ne $text)
            continue
        }
        $translated = $null
        $ok = $false
        try {
            $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=' + $apiLang[$k] + '&dt=t&q=' + [uri]::EscapeDataString($text)
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            $json = $resp.Content | ConvertFrom-Json -NoEnumerate
            if ($json -is [System.Array] -and $json.Count -gt 0 -and $json[0] -is [System.Array]) {
                $parts = @()
                foreach ($seg in $json[0]) {
                    if ($seg -is [System.Array] -and $seg.Count -gt 0) { $parts += [string]$seg[0] }
                }
                if ($parts.Count -gt 0) { $translated = ($parts -join '').Trim(); $ok = ($translated -ne '') }
            }
        } catch { $ok = $false }
        if (-not $ok) {
            try {
                $url2 = 'https://api.mymemory.translated.net/get?q=' + [uri]::EscapeDataString($text) + '&langpair=fr|' + $apiLang[$k]
                $resp2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                $j2 = $resp2.Content | ConvertFrom-Json
                if ($j2.responseData -and $j2.responseData.translatedText) {
                    $translated = ([string]$j2.responseData.translatedText).Trim()
                    $ok = ($translated -ne '')
                }
            } catch { $ok = $false }
        }
        if ($ok -and $translated) {
            $out[$k] = $translated
            $out["ok_$k"] = $true
            $script:TranslateCache[$cacheKey] = $translated
        } else {
            $out[$k] = $text
            $out["ok_$k"] = $false
            $offline = $true
        }
    }
    return $out
}

# Traduit un message (en/nl/de/zh/ja) vers le français via la même API (Google gtx,
# repli MyMemory). Si $FromLang est 'fr' (ou inconnu), renvoie le texte tel quel.
# Repli hors-ligne : texte original.
function ConvertTo-French([string]$Text, [string]$FromLang) {
    $src = ([string]$FromLang).Trim().ToLower()
    if ($src -eq 'fr' -or $src -eq '') { return ([string]$Text) }
    $text = [string]$Text
    if ([string]::IsNullOrWhiteSpace($text)) { return '' }
    $text = $text.Trim()
    if ($text.Length -gt 400) { $text = $text.Substring(0, 400) }
    $apiSrc = @{ en = 'en'; nl = 'nl'; de = 'de'; zh = 'zh-CN'; ja = 'ja' }[$src]
    if (-not $apiSrc) { return $text }
    $cacheKey = 'fr|' + $src + '|' + $text
    if ($script:TranslateCache.ContainsKey($cacheKey)) { return $script:TranslateCache[$cacheKey] }
    $translated = $null
    $ok = $false
    try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
    try {
        $url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + $apiSrc + '&tl=fr&dt=t&q=' + [uri]::EscapeDataString($text)
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $json = $resp.Content | ConvertFrom-Json -NoEnumerate
        if ($json -is [System.Array] -and $json.Count -gt 0 -and $json[0] -is [System.Array]) {
            $parts = @()
            foreach ($seg in $json[0]) {
                if ($seg -is [System.Array] -and $seg.Count -gt 0) { $parts += [string]$seg[0] }
            }
            if ($parts.Count -gt 0) { $translated = ($parts -join '').Trim(); $ok = ($translated -ne '') }
        }
    } catch { $ok = $false }
    if (-not $ok) {
        try {
            $url2 = 'https://api.mymemory.translated.net/get?q=' + [uri]::EscapeDataString($text) + '&langpair=' + $apiSrc + '|fr'
            $resp2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            $j2 = $resp2.Content | ConvertFrom-Json
            if ($j2.responseData -and $j2.responseData.translatedText) {
                $translated = ([string]$j2.responseData.translatedText).Trim()
                $ok = ($translated -ne '')
            }
        } catch { $ok = $false }
    }
    if ($ok -and $translated) {
        $script:TranslateCache[$cacheKey] = $translated
        return $translated
    }
    return $text
}

function Save-Validations {
    try {
        $valFile = Join-Path $Root 'data\validations.json'
        $dir = Split-Path -Parent $valFile
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $json = $script:Validations | ConvertTo-Json -Depth 6 -Compress
        if ($json -isnot [string]) { $json = [string]$json }
        [System.IO.File]::WriteAllText($valFile, $json, (New-Object System.Text.UTF8Encoding $false))
    } catch {}
}

# ---- Modes d'accès (Local / Internet) + tunnel cloudflared ----
function Save-ServerMode {
    try {
        $dir = Split-Path -Parent $script:ServerModeFile
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        $json = $script:ServerMode | ConvertTo-Json -Compress
        if ($json -isnot [string]) { $json = [string]$json }
        [System.IO.File]::WriteAllText($script:ServerModeFile, $json, (New-Object System.Text.UTF8Encoding $false))
    } catch {}
}

function Get-Cloudflared {
    $exe = Join-Path $Root 'data\cloudflared.exe'
    if (Test-Path -LiteralPath $exe) { return $exe }
    if ($script:DownloadingCf) { return $null }
    $script:DownloadingCf = $true
    try {
        Write-Host "  Tunnel : telechargement de cloudflared.exe (une seule fois)..." -ForegroundColor Yellow
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
        $dlUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        $ok = $false
        if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
            & curl.exe -k -L --connect-timeout 30 -o $exe $dlUrl 2>$null
            if (Test-Path -LiteralPath $exe) { $ok = $true }
        }
        if (-not $ok) {
            Invoke-WebRequest -Uri $dlUrl -OutFile $exe -UseBasicParsing -TimeoutSec 120
            if (Test-Path -LiteralPath $exe) { $ok = $true }
        }
        if ($ok) {
            Write-Host "  Tunnel : cloudflared.exe pret." -ForegroundColor Green
            return $exe
        }
        $script:TunnelError = "Telechargement de cloudflared impossible."
    } catch {
        $script:TunnelError = "Telechargement de cloudflared impossible : $($_.Exception.Message)"
    } finally {
        $script:DownloadingCf = $false
    }
    return $null
}

function Start-Tunnel {
    Stop-Tunnel
    $script:TunnelStatus = "starting"
    $script:TunnelUrl = ""
    $script:TunnelError = ""
    $exe = Get-Cloudflared
    if (-not $exe) { $script:TunnelStatus = "error"; return }
    try {
        $dir = Split-Path -Parent $script:TunnelLog
        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Remove-Item -LiteralPath $script:TunnelLog -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $script:TunnelLogErr -Force -ErrorAction SilentlyContinue
        $args = @("tunnel","--no-autoupdate","--url","https://localhost:$HttpsPort","--no-tls-verify")
        $p = Start-Process -FilePath $exe -ArgumentList $args -PassThru -WindowStyle Hidden -RedirectStandardOutput $script:TunnelLog -RedirectStandardError $script:TunnelLogErr
        $script:TunnelProcess = $p
        $script:LastTunnelPoll = [datetime]::MinValue
    } catch {
        $script:TunnelStatus = "error"
        $script:TunnelError = $_.Exception.Message
    }
}

function Stop-Tunnel {
    if ($script:TunnelProcess) {
        try {
            if (-not $script:TunnelProcess.HasExited) { $script:TunnelProcess.Kill() }
        } catch {}
        $script:TunnelProcess = $null
    }
    $script:TunnelStatus = "off"
    $script:TunnelUrl = ""
    $script:TunnelError = ""
}

function Poll-Tunnel {
    if ($script:TunnelStatus -ne "starting") { return }
    if ([datetime]::Now -lt $script:LastTunnelPoll.AddSeconds(1)) { return }
    $script:LastTunnelPoll = [datetime]::Now
    if ($script:TunnelProcess) {
        try {
            if ($script:TunnelProcess.HasExited) {
                $script:TunnelStatus = "error"
                $script:TunnelError = "Le tunnel s'est arrete (code $($script:TunnelProcess.ExitCode))."
                $script:TunnelProcess = $null
                return
            }
        } catch {
            $script:TunnelStatus = "error"
            $script:TunnelError = "Processus du tunnel introuvable."
            return
        }
    }
    $text = ""
    foreach ($lf in @($script:TunnelLog, $script:TunnelLogErr)) {
        try {
            if (Test-Path -LiteralPath $lf) { $text += Get-Content -LiteralPath $lf -Raw -Encoding UTF8 }
        } catch {}
    }
    if ($text -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $script:TunnelUrl = $Matches[0]
        $script:TunnelStatus = "on"
        Write-Host "  Tunnel public : $($script:TunnelUrl)" -ForegroundColor Green
    } elseif ($text -match 'ERR |error|Unable to reach the origin|failed') {
        $script:TunnelStatus = "error"
        $script:TunnelError = "Impossible de demarrer le tunnel (verifiez la connexion internet)."
    }
}

function Get-ServerModePayload {
    $netIp = Get-LocalIPv4
    $lanUrl = if ($cert) { "https://${netIp}:$HttpsPort" } else { "http://${netIp}:$Port" }
    $tunnelUp = ($script:TunnelStatus -eq "on" -and $script:TunnelUrl)
    $primary = if ($script:ServerMode.internet -and $tunnelUp) { $script:TunnelUrl } else { $lanUrl }
    return [ordered]@{
        local         = [bool]$script:ServerMode.local
        internet      = [bool]$script:ServerMode.internet
        tunnelStatus  = $script:TunnelStatus
        tunnelUrl     = $script:TunnelUrl
        tunnelError   = $script:TunnelError
        lanUrl        = $lanUrl
        url           = $primary
    }
}

function Handle-Client([System.Net.Sockets.TcpClient]$Client, [System.IO.Stream]$Stream) {
    try {
        if ($null -eq $Stream) { $Stream = $Client.GetStream() }
        $Stream.ReadTimeout = 15000
        $ms = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 8192
        $headStr = ""
        do {
            $read = $stream.Read($buffer, 0, $buffer.Length)
            if ($read -le 0) { break }
            $ms.Write($buffer, 0, $read)
            $headStr = [System.Text.Encoding]::ASCII.GetString($ms.ToArray())
            if ($headStr.Contains("`r`n`r`n")) { break }
        } while ($ms.Length -lt 65536)

        $request = $headStr
        $body = ""
        $headEnd = $headStr.IndexOf("`r`n`r`n")
        if ($headEnd -ge 0) {
            $request = $headStr.Substring(0, $headEnd + 4)
            $contentLength = 0
            if ($headStr -match '(?im)^Content-Length:\s*(\d+)') { $contentLength = [int]$Matches[1] }
            while ($ms.Length -lt ($headEnd + 4 + $contentLength)) {
                $read = $stream.Read($buffer, 0, $buffer.Length)
                if ($read -le 0) { break }
                $ms.Write($buffer, 0, $read)
            }
            if ($contentLength -gt 0 -and $ms.Length -gt ($headEnd + 4)) {
                $avail = [Math]::Min($contentLength, $ms.Length - ($headEnd + 4))
                $all = $ms.ToArray()
                $body = [System.Text.Encoding]::UTF8.GetString($all, $headEnd + 4, $avail)
            }
        }

        $lines = $request -split "`r`n"
        $requestLine = $lines[0]
        if (-not $requestLine) {
            Send-Response $Stream 400 "Bad Request" "<h1>400 Bad Request</h1>"
            return
        }
        $parts = $requestLine -split ' +'
        $method = $parts[0]
        $target = $parts[1]

        if ($method -eq 'HEAD') {
            Send-Response $Stream 200 "OK" "" $null
            return
        }
        if ($method -ne 'GET' -and $method -ne 'POST') {
            Send-Response $Stream 405 "Method Not Allowed" "<h1>405 Method Not Allowed</h1>"
            return
        }

        # Endpoint de détection réseau : expose l'adresse sécurisée du serveur au jeu
        $apiPath = ($target -split '\?')[0].Split('#')[0]
        if ($apiPath -ieq '/api/ip') {
            $mode = Get-ServerModePayload
            $payload = @{ ip = (Get-LocalIPv4); port = $HttpsPort; url = $mode.url; lanUrl = $mode.lanUrl; tunnelUrl = $mode.tunnelUrl; internet = $mode.internet } | ConvertTo-Json -Compress
            Send-Response $Stream 200 "OK" $payload "application/json; charset=utf-8"
            return
        }

        # ---- Serveur : modes d'accès Local / Internet (tunnel cloudflared) ----
        if ($apiPath -ieq '/api/server-mode') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($payload) {
                    $newLocal = [bool]$script:ServerMode.local
                    $newInternet = [bool]$script:ServerMode.internet
                    if ($null -ne $payload.local) { $newLocal = [bool]$payload.local }
                    if ($null -ne $payload.internet) { $newInternet = [bool]$payload.internet }
                    if (-not $newLocal -and -not $newInternet) {
                        Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"no-mode`"}" "application/json; charset=utf-8"
                        return
                    }
                    $script:ServerMode.local = $newLocal
                    $script:ServerMode.internet = $newInternet
                    Save-ServerMode
                    if ($newInternet) {
                        if ($script:TunnelStatus -ne "on") { Start-Tunnel }
                    } else {
                        if ($script:TunnelStatus -ne "off") { Stop-Tunnel }
                    }
                    Send-Response $Stream 200 "OK" ((Get-ServerModePayload) | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-payload`"}" "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 200 "OK" ((Get-ServerModePayload) | ConvertTo-Json -Compress) "application/json; charset=utf-8"
            return
        }

        # ---- Wi-Fi du site : QR d'accès des familles ----
        if ($apiPath -ieq '/api/wifi') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($null -eq $payload) {
                    Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-payload`"}" "application/json; charset=utf-8"
                    return
                }
                $sec = [string]$payload.security
                if ($sec -notin @('WPA','WEP','nopass')) { $sec = 'WPA' }
                $script:Wifi.ssid = [string]$payload.ssid
                $script:Wifi.password = [string]$payload.password
                $script:Wifi.security = $sec
                Save-Wifi
                $out = @{ ok = $true; ssid = $script:Wifi.ssid; security = $script:Wifi.security; hasWifi = ($script:Wifi.ssid -ne '') }
                Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                return
            }
            $out = @{ ssid = $script:Wifi.ssid; password = $script:Wifi.password; security = $script:Wifi.security; hasWifi = ($script:Wifi.ssid -ne '') }
            Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
            return
        }

        # ---- Détection automatique du Wi-Fi courant de la machine (netsh) ----
        if ($apiPath -ieq '/api/wifi/detect') {
            $ssid = ''
            $signal = ''
            try {
                $netsh = (& netsh wlan show interfaces 2>$null | Out-String)
                foreach ($l in ($netsh -split "`r?`n")) {
                    $t = [string]$l
                    if ($t -match '^\s*SSID\s*:') { $ssid = (($t -split ':', 2)[1]).Trim() }
                    if ($t -match '^\s*Signal\s*:') { $signal = (($t -split ':', 2)[1]).Trim() }
                }
            } catch {}
            $out = @{ ok = $true; ssid = $ssid; signal = $signal; detected = ($ssid -ne '') }
            Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
            return
        }

        # ---- Carte du parcours : URL externe vue par les participants ----
        if ($apiPath -ieq '/api/map') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($null -eq $payload) {
                    Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-payload`"}" "application/json; charset=utf-8"
                    return
                }
                $script:MapUrl = [string]$payload.url
                Save-Map
                $out = @{ ok = $true; url = $script:MapUrl; hasMap = ($script:MapUrl -ne '') }
                Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                return
            }
            $out = @{ url = $script:MapUrl; hasMap = ($script:MapUrl -ne '') }
            Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
            return
        }

        # ---- Tableau de bord : état (message diffusé + épreuve en cours) ----
        if ($apiPath -ieq '/api/board') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($payload -and $payload.action -eq 'message') {
                    $msg = @{}
                    foreach ($k in @('fr','en','nl','de','zh','ja')) { $msg[$k] = "" }
                    $provided = @{ fr = $false; en = $false; nl = $false; de = $false; zh = $false; ja = $false }
                    if ($payload.messages) {
                        foreach ($k in @('fr','en','nl','de','zh','ja')) {
                            if ($payload.messages.PSObject.Properties.Name -contains $k) {
                                $msg[$k] = [string]$payload.messages.$k
                                $provided[$k] = (-not [string]::IsNullOrWhiteSpace($msg[$k]))
                            }
                        }
                    } else {
                        $msg['fr'] = [string]$payload.text
                        $provided['fr'] = (-not [string]::IsNullOrWhiteSpace($msg['fr']))
                    }
                    # Traduction automatique des langues non fournies (repli français si hors-ligne)
                    $translated = @{ en = $false; nl = $false; de = $false; zh = $false; ja = $false }
                    $auto = $false
                    foreach ($k in @('en','nl','de','zh','ja')) {
                        if ($provided[$k]) { $translated[$k] = $true }
                        else { $auto = $true }
                    }
                    if ($auto) {
                        $tr = ConvertTo-TeamLanguages $msg['fr']
                        foreach ($k in @('en','nl','de','zh','ja')) {
                            if (-not $provided[$k]) {
                                $msg[$k] = $tr[$k]
                                $translated[$k] = [bool]$tr["ok_$k"]
                            }
                        }
                    }
                    $script:BoardMessage = $msg
                    $script:BoardSeq++
                    Send-Response $Stream 200 "OK" (@{ ok = $true; seq = $script:BoardSeq; translated = $translated } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                if ($payload -and $payload.action -eq 'logout' -and $payload.team) {
                    $teamKey = ([string]$payload.team).Trim().ToLower()
                    if ($teamKey) {
                        $script:BoardLogout[$teamKey] = (Get-Date).ToUniversalTime()
                        $script:LogoutSeq++
                        Send-Response $Stream 200 "OK" (@{ ok = $true; logoutSeq = $script:LogoutSeq } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                        return
                    }
                }
                if ($payload -and $payload.action -eq 'logoutAck' -and $payload.team) {
                    $teamKey = ([string]$payload.team).Trim().ToLower()
                    if ($teamKey -and $script:BoardLogout.ContainsKey($teamKey)) {
                        $script:BoardLogout.Remove($teamKey)
                    }
                    Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                    return
                }
                if ($payload -and $payload.action -eq 'challenge' -and $payload.challenge) {
                    # Ne jamais exposer la réponse de l'épreuve aux participants
                    $ch = $payload.challenge
                    if ($ch.PSObject.Properties.Name -contains 'answer') {
                        $ch = $ch.PSObject.Copy()
                        $ch.PSObject.Properties.Remove('answer')
                    }
                    $script:BoardChallenge = $ch
                    $script:ChallengeSeq++
                    $script:BoardSeq++
                    Send-Response $Stream 200 "OK" (@{ ok = $true; challengeSeq = $script:ChallengeSeq } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                if ($payload -and $payload.action -eq 'clear') {
                    $script:BoardMessage = @{}
                    $script:BoardChallenge = $null
                    $script:BoardSeq++
                    $script:ChallengeSeq++
                    Send-Response $Stream 200 "OK" (@{ ok = $true } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"bad-action`"}" "application/json; charset=utf-8"
                return
            }
            $challenge = $null
            if ($null -ne $script:BoardChallenge) {
                $challenge = $script:BoardChallenge
                if ($challenge.PSObject.Properties.Name -contains 'answer') {
                    $challenge = $challenge.PSObject.Copy()
                    $challenge.PSObject.Properties.Remove('answer')
                }
            }
            # Purge des commandes de déconnexion trop anciennes (> 10 min)
            $nowUtc = (Get-Date).ToUniversalTime()
            $stale = @($script:BoardLogout.GetEnumerator() | Where-Object { ($nowUtc - $_.Value).TotalMinutes -gt 10 } | ForEach-Object { $_.Key })
            foreach ($s in $stale) { $script:BoardLogout.Remove($s) }
            $payload = @{
                seq = $script:BoardSeq
                message = $script:BoardMessage
                challenge = $challenge
                challengeSeq = $script:ChallengeSeq
                logoutTeams = @($script:BoardLogout.Keys)
                logoutSeq = $script:LogoutSeq
            }
            Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 6) "application/json; charset=utf-8"
            return
        }

        # ---- Réponse d'un participant à une épreuve ----
        if ($apiPath -ieq '/api/answer') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($payload -and $payload.text) {
                    $item = [ordered]@{
                        team = [string]$payload.team
                        text = [string]$payload.text
                        challengeId = [string]$payload.challengeId
                        at = (Get-Date).ToString('HH:mm:ss')
                    }
                    [void]$script:Answers.Add($item)
                    if ($script:Answers.Count -gt 60) { $script:Answers.RemoveRange(0, $script:Answers.Count - 60) }
                    Send-Response $Stream 200 "OK" (@{ ok = $true } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"empty`"}" "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }

        # ---- Liste des réponses (pour le tableau de bord) ----
        if ($apiPath -ieq '/api/answers') {
            Send-Response $Stream 200 "OK" (@{ answers = @($script:Answers) } | ConvertTo-Json -Compress -Depth 5) "application/json; charset=utf-8"
            return
        }

        # ---- Position GPS d'une équipe (participant -> tableau de bord) ----
        if ($apiPath -ieq '/api/pos') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                $name = ''
                if ($payload) { $name = [string]$payload.team }
                if (-not $name) {
                    Send-Response $Stream 400 "Bad Request" "{`"ok`":false}" "application/json; charset=utf-8"
                    return
                }
                $lat = 0.0; $lng = 0.0
                if ($payload) {
                    try { $lat = [double]$payload.lat } catch {}
                    try { $lng = [double]$payload.lng } catch {}
                }
                $now = (Get-Date).ToUniversalTime()
                $entry = $null
                for ($i = 0; $i -lt $script:Positions.Count; $i++) {
                    if ($script:Positions[$i].team -ieq $name) { $entry = $script:Positions[$i]; break }
                }
                if (-not $entry) {
                    $entry = [ordered]@{ team = $name; lat = 0.0; lng = 0.0; at = $null; seen = $now; acc = $null; bat = $null; chg = $null; onl = $null; net = ''; cam = '' }
                    [void]$script:Positions.Add($entry)
                    if ($script:Positions.Count -gt 60) { $script:Positions.RemoveAt(0) }
                }
                if ($lat -ne 0 -and $lng -ne 0 -and $lat -gt -90 -and $lat -lt 90 -and $lng -gt -180 -and $lng -lt 180) {
                    $entry.lat = $lat
                    $entry.lng = $lng
                    $entry.at = $now
                }
                $entry.seen = $now
                foreach ($k in @('acc','bat','onl','net','cam')) {
                    try { if ($null -ne $payload.$k -and '' -ne [string]$payload.$k) { $entry[$k] = $payload.$k } } catch {}
                }
                try { if ($null -ne $payload.chg) { $entry.chg = [bool]$payload.chg } } catch {}
                $script:PositionSeq++
                Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                return
            }
            # GET : positions récentes (moins de 3 min) + états des appareils (15 min)
            $now = (Get-Date).ToUniversalTime()
            $fresh = @($script:Positions | Where-Object { $_.at -and ($now - $_.at).TotalMinutes -lt 3 })
            $statuses = @($script:Positions | Where-Object { $_.seen -and ($now - $_.seen).TotalMinutes -lt 15 })
            $payload = @{
                seq = $script:PositionSeq
                positions = @($fresh | ForEach-Object { @{ team = $_.team; lat = $_.lat; lng = $_.lng; at = $_.at.ToString('HH:mm:ss'); acc = $_.acc } })
                statuses = @($statuses | ForEach-Object { @{
                    team = $_.team; bat = $_.bat; chg = $_.chg; onl = $_.onl; net = $_.net; cam = $_.cam; acc = $_.acc
                    seen = if ($_.seen) { $_.seen.ToString('HH:mm:ss') } else { '' }
                    posAt = if ($_.at) { $_.at.ToString('HH:mm:ss') } else { '' }
                    lat = $_.lat; lng = $_.lng
                } })
            }
            Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 5) "application/json; charset=utf-8"
            return
        }

        # ---- Équipes ayant terminé le parcours (participant -> tableau de bord) ----
        if ($apiPath -ieq '/api/finish') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                $name = [string]$payload.team
                if ($name) {
                    $entry = [ordered]@{
                        team    = $name
                        stars   = 0
                        seconds = 0
                        balises = 0
                        offered = 0
                        message = ''
                        selfie  = ''
                        at      = (Get-Date).ToUniversalTime().ToString('o')
                    }
                    if ($payload) {
                        foreach ($k in @('stars','seconds','balises','offered','message','selfie')) {
                            try { $entry[$k] = $payload.$k } catch {}
                        }
                    }
                    $found = $false
                    for ($i = 0; $i -lt $script:Finishes.Count; $i++) {
                        if ($script:Finishes[$i].team -ieq $name) {
                            $script:Finishes[$i] = $entry
                            $found = $true
                            break
                        }
                    }
                    if (-not $found) {
                        [void]$script:Finishes.Add($entry)
                        if ($script:Finishes.Count -gt 60) { $script:Finishes.RemoveAt(0) }
                    }
                    try {
                        $fiFile = Join-Path $Root 'data\finishes.json'
                        $dir = Split-Path -Parent $fiFile
                        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
                        $json = $script:Finishes | ConvertTo-Json -Depth 6 -Compress
                        if ($json -isnot [string]) { $json = [string]$json }
                        [System.IO.File]::WriteAllText($fiFile, $json, (New-Object System.Text.UTF8Encoding $false))
                    } catch {}
                    Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false}" "application/json; charset=utf-8"
                return
            }
            $payload = @{
                finishes = @($script:Finishes | ForEach-Object { @{ team = $_.team; stars = $_.stars; seconds = $_.seconds; balises = $_.balises; offered = $_.offered; message = $_.message; selfie = $_.selfie; at = $_.at } })
            }
            Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 5) "application/json; charset=utf-8"
            return
        }

        # ---- Alerte Urgence (participant -> tableau de bord) ----
        if ($apiPath -ieq '/api/urgency') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                $name = [string]$payload.team
                $type = [string]$payload.type
                if ($name -and ($type -eq 'lost' -or $type -eq 'emergency' -or $type -eq 'message')) {
                    $lat = 0.0; $lng = 0.0
                    if ($payload) {
                        try { $lat = [double]$payload.lat } catch {}
                        try { $lng = [double]$payload.lng } catch {}
                    }
                    $rawMessage = ''
                    if ($type -eq 'message') { $rawMessage = [string]$payload.message }
                    if ($type -eq 'message' -and [string]::IsNullOrWhiteSpace($rawMessage)) {
                        Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"empty-message`"}" "application/json; charset=utf-8"
                        return
                    }
                    $srcLang = [string]$payload.lang
                    if ($srcLang -notin @('fr','en','nl','de','zh','ja')) { $srcLang = 'fr' }
                    $message = $rawMessage
                    if ($type -eq 'message') {
                        $message = ConvertTo-French $rawMessage $srcLang
                    }
                    $entry = [ordered]@{
                        team        = $name
                        type        = $type
                        lat         = $lat
                        lng         = $lng
                        message     = $message
                        messageOrig = $rawMessage
                        lang        = $srcLang
                        at          = (Get-Date).ToUniversalTime().ToString('o')
                        status      = 'open'
                    }
                    $found = $false
                    for ($i = 0; $i -lt $script:Urgencies.Count; $i++) {
                        if ($script:Urgencies[$i].status -eq 'open' -and $script:Urgencies[$i].team -ieq $name) {
                            $script:Urgencies[$i] = $entry
                            $found = $true
                            break
                        }
                    }
                    if (-not $found) {
                        [void]$script:Urgencies.Add($entry)
                        if ($script:Urgencies.Count -gt 100) { $script:Urgencies.RemoveAt(0) }
                    }
                    try {
                        $urgFile = Join-Path $Root 'data\urgencies.json'
                        $dir = Split-Path -Parent $urgFile
                        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
                        $json = $script:Urgencies | ConvertTo-Json -Depth 6 -Compress
                        if ($json -isnot [string]) { $json = [string]$json }
                        [System.IO.File]::WriteAllText($urgFile, $json, (New-Object System.Text.UTF8Encoding $false))
                    } catch {}
                    Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false}" "application/json; charset=utf-8"
                return
            }
            $open = @($script:Urgencies | Where-Object { $_.status -eq 'open' })
            $payload = @{
                urgencies = @($open | ForEach-Object { @{ team = $_.team; type = $_.type; lat = $_.lat; lng = $_.lng; at = $_.at; message = $_.message; messageOrig = $_.messageOrig; lang = $_.lang } })
            }
            Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 5) "application/json; charset=utf-8"
            return
        }

        # ---- Résolution d'une alerte Urgence (tableau de bord) ----
        if ($apiPath -ieq '/api/urgency/resolve') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                $name = [string]$payload.team
                if ($name) {
                    for ($i = 0; $i -lt $script:Urgencies.Count; $i++) {
                        if ($script:Urgencies[$i].status -eq 'open' -and $script:Urgencies[$i].team -ieq $name) {
                            $script:Urgencies[$i].status = 'resolved'
                            $script:Urgencies[$i].resolvedAt = (Get-Date).ToUniversalTime().ToString('o')
                        }
                    }
                    try {
                        $urgFile = Join-Path $Root 'data\urgencies.json'
                        $json = $script:Urgencies | ConvertTo-Json -Depth 6 -Compress
                        if ($json -isnot [string]) { $json = [string]$json }
                        [System.IO.File]::WriteAllText($urgFile, $json, (New-Object System.Text.UTF8Encoding $false))
                    } catch {}
                    Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false}" "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }

        # ---- Questionnaire testeur (réponses interactives, persistées) ----
        if ($apiPath -ieq '/api/feedback') {
            if ($method -eq 'POST') {
                $payload = $null
                try { $payload = ConvertFrom-Json -InputObject $body } catch {}
                if ($payload) {
                    $entry = [ordered]@{
                        at    = (Get-Date).ToUniversalTime().ToString('o')
                        lang  = [string]$payload.lang
                        team  = [string]$payload.team
                        answers = $payload.answers
                        meta  = $payload.meta
                    }
                    [void]$script:Feedback.Add($entry)
                    if ($script:Feedback.Count -gt 500) { $script:Feedback.RemoveAt(0) }
                    try {
                        $fbFile = Join-Path $Root 'data\feedback.json'
                        $dir = Split-Path -Parent $fbFile
                        if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
                        $json = $script:Feedback | ConvertTo-Json -Depth 8 -Compress
                        if ($json -isnot [string]) { $json = [string]$json }
                        [System.IO.File]::WriteAllText($fbFile, $json, (New-Object System.Text.UTF8Encoding $false))
                    } catch {}
                    Send-Response $Stream 200 "OK" (@{ ok = $true } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                    return
                }
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"empty`"}" "application/json; charset=utf-8"
                return
            }
        $count = if ($script:Feedback) { $script:Feedback.Count } else { 0 }
        Send-Response $Stream 200 "OK" (@{ count = $count } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
        return
    }

    # ---- Validations de balises par équipe (tableau de bord + participants) ----
    if ($apiPath -ieq '/api/validations') {
        if ($method -eq 'POST') {
            $payload = $null
            try { $payload = ConvertFrom-Json -InputObject $body } catch {}
            $name = [string]$payload.team
            $balise = [string]$payload.balise
            if ($name -and $balise) {
                if (-not $script:Validations.ContainsKey($name)) { $script:Validations[$name] = @() }
                $list = @($script:Validations[$name])
                if ($list -notcontains $balise) {
                    $script:Validations[$name] = @($list + $balise)
                }
                Save-Validations
                $out = @{ ok = $true; balises = @($script:Validations[$name]) }
                Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"missing-fields`"}" "application/json; charset=utf-8"
            return
        }
        $payload = @{ validations = $script:Validations }
        Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 6) "application/json; charset=utf-8"
        return
    }

    if ($apiPath -ieq '/api/validations/remove') {
        if ($method -eq 'POST') {
            $payload = $null
            try { $payload = ConvertFrom-Json -InputObject $body } catch {}
            $name = [string]$payload.team
            $balise = [string]$payload.balise
            if ($name -and $script:Validations.ContainsKey($name)) {
                $script:Validations[$name] = @($script:Validations[$name] | Where-Object { $_ -ne $balise })
                Save-Validations
                $out = @{ ok = $true; balises = @($script:Validations[$name]) }
                Send-Response $Stream 200 "OK" ($out | ConvertTo-Json -Compress) "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"missing-fields`"}" "application/json; charset=utf-8"
            return
        }
        Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
        return
    }

    # ---- Créer une équipe vide dans les validations (tableau de bord) ----
    if ($apiPath -ieq '/api/validations/team') {
        if ($method -eq 'POST') {
            $payload = $null
            try { $payload = ConvertFrom-Json -InputObject $body } catch {}
            $name = [string]$payload.team
            if ($name) {
                if (-not $script:Validations.ContainsKey($name)) {
                    $script:Validations[$name] = @()
                    Save-Validations
                }
                Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
                return
            }
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"missing-team`"}" "application/json; charset=utf-8"
            return
        }
        Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
        return
    }

    # ---- Rapport complet (god mode / dashboard) : état du serveur ----
    if ($apiPath -ieq '/api/report') {
        if ($method -ne 'GET') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $g = { param($o, $n) if ($null -ne $o -and $o.PSObject.Properties.Name -contains $n) { $o.$n } else { '' } }
        $L = New-Object System.Collections.Generic.List[string]
        $L.Add('==================================================')
        $L.Add('JDP — RAPPORT COMPLET')
        $L.Add('Généré le : ' + (Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))
        $L.Add('')

        $sm = $script:ServerMode
        $modeTxt = 'Local'
        if (& $g $sm 'internet') { $modeTxt = 'Internet (tunnel cloudflared)' }
        $L.Add('=== ACCÈS AU SERVEUR ===')
        $L.Add('Mode : ' + $modeTxt)
        $lanUrl = [string](& $g $sm 'lanUrl')
        if ($lanUrl) { $L.Add('URL LAN : ' + $lanUrl) }
        $tunUrl = [string](& $g $sm 'tunnelUrl')
        if ($tunUrl) { $L.Add('URL tunnel : ' + $tunUrl) }
        $L.Add('')

        $L.Add('=== BALISES VALIDÉES PAR ÉQUIPE ===')
        if ($script:Validations -and $script:Validations.Count -gt 0) {
            foreach ($k in ($script:Validations.Keys | Sort-Object)) {
                $v = @($script:Validations[$k])
                $L.Add(('  ' + $k + ' : ' + $v.Count + ' balise(s) — ' + ($v -join ', ')))
            }
        } else {
            $L.Add('  Aucune validation enregistrée.')
        }
        $L.Add('')

        $L.Add('=== ÉQUIPES TERMINÉES ===')
        if ($script:Finishes -and $script:Finishes.Count -gt 0) {
            $rank = 0
            foreach ($f in ($script:Finishes | Sort-Object -Property @{ Expression = { [int](& $g $_ 'stars') }; Descending = $true }, @{ Expression = { [int](& $g $_ 'seconds') } })) {
                $rank++
                $msg = [string](& $g $f 'message')
                $L.Add(('  ' + $rank + '. ' + (& $g $f 'team') + ' — ' + (& $g $f 'stars') + ' ⭐ — ' + (& $g $f 'seconds') + ' s — ' + (& $g $f 'balises') + ' balises'))
                if ($msg) { $L.Add('      Message : ' + $msg) }
            }
        } else {
            $L.Add('  Aucune équipe terminée.')
        }
        $L.Add('')

        $L.Add('=== URGENCES / MESSAGES OUVERTS ===')
        $openUrg = @($script:Urgencies | Where-Object { (& $g $_ 'status') -eq 'open' })
        if ($openUrg.Count) {
            foreach ($u in $openUrg) {
                $um = [string](& $g $u 'message')
                $line = '  [' + (& $g $u 'at') + '] ' + (& $g $u 'team') + ' — ' + (& $g $u 'type')
                $ulat = [string](& $g $u 'lat'); $ulng = [string](& $g $u 'lng')
                if ($ulat -ne '' -and $ulng -ne '') { $line += ' — ' + $ulat + ', ' + $ulng }
                $L.Add($line)
                if ($um) { $L.Add('      ' + $um) }
            }
        } else {
            $L.Add('  Aucune urgence ouverte.')
        }
        $L.Add('')

        $L.Add('=== POSITIONS DES ÉQUIPES (3 dernières minutes) ===')
        $now = Get-Date
        $fresh = @($script:Positions | Where-Object { (& $g $_ 'team') -and ($now - (& $g $_ 'at')).TotalMinutes -lt 3 })
        if ($fresh.Count) {
            foreach ($p in $fresh) {
                $pat = (& $g $p 'at')
                if ($pat) {
                    $L.Add(('  ' + $pat.ToString('HH:mm:ss') + ' — ' + (& $g $p 'team') + ' — ' + [math]::Round([double](& $g $p 'lat'), 5) + ', ' + [math]::Round([double](& $g $p 'lng'), 5)))
                }
            }
        } else {
            $L.Add('  Aucune position récente.')
        }
        $L.Add('')

        $fbCount = 0
        if ($script:Feedback) { $fbCount = $script:Feedback.Count }
        $L.Add('=== RETOURS TESTEURS ===')
        $L.Add('  Questionnaires reçus : ' + $fbCount)
        $L.Add('')

        $edFile = Join-Path $Root 'admin-data.json'
        $ad = $null
        if (Test-Path -LiteralPath $edFile) {
            try { $ad = Get-Content -LiteralPath $edFile -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $ad = $null }
        }
        $nSite = 0; $nBal = 0; $nBirds = 0; $nQuiz = 0; $nRemB = 0; $nRemBird = 0
        if ($ad) {
            if ($ad.PSObject.Properties.Name -contains 'site') { $nSite = @($ad.site.PSObject.Properties).Count }
            if ($ad.PSObject.Properties.Name -contains 'balises') { $nBal = @($ad.balises.PSObject.Properties).Count }
            if ($ad.PSObject.Properties.Name -contains 'birds') { $nBirds = @($ad.birds.PSObject.Properties).Count }
            if ($ad.PSObject.Properties.Name -contains 'quiz') { $nQuiz = @($ad.quiz.PSObject.Properties).Count }
            if ($ad.PSObject.Properties.Name -contains 'removedBalises') { $nRemB = @($ad.removedBalises).Count }
            if ($ad.PSObject.Properties.Name -contains 'removedBirds') { $nRemBird = @($ad.removedBirds).Count }
        }
        $L.Add('=== CONTENU ÉDITÉ (admin-data.json) ===')
        $L.Add('  Site : ' + $nSite + ' · Balises modifiées/ajoutées : ' + $nBal + ' · Oiseaux ajoutés : ' + $nBirds + ' · Quiz modifiés : ' + $nQuiz + ' · Balises supprimées : ' + $nRemB + ' · Oiseaux supprimés : ' + $nRemBird)
        $L.Add('')

        $L.Add('=== SYSTÈME ===')
        $proc = Get-Process -Id $PID -ErrorAction SilentlyContinue
        if ($proc) { $L.Add('  Mémoire serveur : ' + [math]::Round($proc.WorkingSet64 / 1MB, 1) + ' Mo') }
        $L.Add('  Heure UTC : ' + (Get-Date).ToUniversalTime().ToString('o'))
        $L.Add('==================================================')

        $text = ($L -join "`r`n")
        $html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>JDP — Rapport</title></head><body><pre>' + [System.Net.WebUtility]::HtmlEncode($text) + '</pre></body></html>'
        $subject = 'JDP — Rapport complet ' + (Get-Date).ToString('dd/MM/yyyy HH:mm')
        $payload = @{ ok = $true; subject = $subject; text = $text; html = $html }
        Send-Response $Stream 200 "OK" ($payload | ConvertTo-Json -Compress -Depth 5) "application/json; charset=utf-8"
        return
    }

    # ---- Editeur de contenu : lire / enregistrer admin-data.json ----
    if ($apiPath -ieq '/api/editor') {
        $edFile = Join-Path $Root 'admin-data.json'
        if ($method -eq 'POST') {
            $payload = $null
            try { $payload = ConvertFrom-Json -InputObject $body } catch {}
            if ($null -eq $payload -or $payload -isnot [System.Management.Automation.PSCustomObject]) {
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-json`"}" "application/json; charset=utf-8"
                return
            }
            $data = $payload
            if ($data.PSObject.Properties.Name -contains 'data') { $data = $data.data }
            if ($data -isnot [System.Management.Automation.PSCustomObject]) {
                Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-data`"}" "application/json; charset=utf-8"
                return
            }
            try {
                $json = $data | ConvertTo-Json -Depth 100 -Compress
                if ($json -isnot [string]) { $json = [string]$json }
                [System.IO.File]::WriteAllText($edFile, $json, (New-Object System.Text.UTF8Encoding $false))
                Send-Response $Stream 200 "OK" (@{ ok = $true } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
            } catch {
                Send-Response $Stream 500 "Server Error" "{`"ok`":false,`"error`":`"write-failed`"}" "application/json; charset=utf-8"
            }
            return
        }
        # GET : renvoie le contenu actuel des surcharges (ou objet vide)
        $obj = @{}
        if (Test-Path -LiteralPath $edFile) {
            try { $obj = Get-Content -LiteralPath $edFile -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $obj = @{} }
        }
        Send-Response $Stream 200 "OK" (@{ data = $obj } | ConvertTo-Json -Compress -Depth 100) "application/json; charset=utf-8"
        return
    }

    # ---- Editeur : lister les images disponibles dans img\ (menu déroulant) ----
    if ($apiPath -ieq '/api/editor/images') {
        if ($method -ne 'GET') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $imgDir = Join-Path $Root 'img'
        $list = @()
        if (Test-Path -LiteralPath $imgDir) {
            $list = @(Get-ChildItem -LiteralPath $imgDir -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|gif|svg|webp)$' } |
                ForEach-Object {
                    $rel = $_.FullName.Substring($imgDir.Length).Replace('\', '/').TrimStart('/')
                    'img/' + ((($rel -split '/') | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join '/')
                } | Sort-Object)
        }
        Send-Response $Stream 200 "OK" ($list | ConvertTo-Json -Compress) "application/json; charset=utf-8"
        return
    }

    # ---- Editeur : televerser une image (base64) vers img\ ----
    if ($apiPath -ieq '/api/editor/image') {
        if ($method -ne 'POST') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $payload = $null
        try { $payload = ConvertFrom-Json -InputObject $body } catch {}
        if (-not $payload -or -not $payload.name -or -not $payload.data) {
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"missing-fields`"}" "application/json; charset=utf-8"
            return
        }
        $name = [string]$payload.name
        if ($name -match '[\\/]' -or $name -notmatch '^[A-Za-z0-9_% .\u00C0-\u00FF\-]+\.(jpg|jpeg|png|gif|svg|webp)$') {
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-name`"}" "application/json; charset=utf-8"
            return
        }
        $b64 = [string]$payload.data
        $bytes = $null
        try { $bytes = [System.Convert]::FromBase64String($b64) } catch {}
        if ($null -eq $bytes -or $bytes.Length -lt 16) {
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"invalid-data`"}" "application/json; charset=utf-8"
            return
        }
        $dir = Join-Path $Root 'img'
        try {
            if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            [System.IO.File]::WriteAllBytes((Join-Path $dir $name), $bytes)
            Send-Response $Stream 200 "OK" (@{ ok = $true; url = "img/$name" } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
        } catch {
            Send-Response $Stream 500 "Server Error" "{`"ok`":false,`"error`":`"write-failed`"}" "application/json; charset=utf-8"
        }
        return
    }

    # ---- QR codes : enregistrer plusieurs images JPG dans qrcodes\ ----
    if ($apiPath -ieq '/api/qr/export') {
        if ($method -ne 'POST') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $payload = $null
        try { $payload = ConvertFrom-Json -InputObject $body } catch {}
        $files = @()
        if ($payload -and $payload.files) { $files = @($payload.files) }
        if ($files.Count -eq 0) {
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"missing-files`"}" "application/json; charset=utf-8"
            return
        }
        $qrDir = Join-Path $Root 'qrcodes'
        if (-not (Test-Path -LiteralPath $qrDir)) { New-Item -ItemType Directory -Path $qrDir -Force | Out-Null }
        $saved = @()
        $errors = @()
        foreach ($f in $files) {
            $name = [string]$f.name
            $b64 = [string]$f.data
            if ($name -match '[\\/]' -or $name -notmatch '^[A-Za-z0-9_ %\u00C0-\u00FF\-]+\.(jpg|jpeg)$') {
                $errors += $name
                continue
            }
            $bytes = $null
            try { $bytes = [System.Convert]::FromBase64String($b64) } catch {}
            if ($null -eq $bytes -or $bytes.Length -lt 16) { $errors += $name; continue }
            try {
                [System.IO.File]::WriteAllBytes((Join-Path $qrDir $name), $bytes)
                $saved += $name
            } catch { $errors += $name }
        }
        Send-Response $Stream 200 "OK" (@{ ok = ($errors.Count -eq 0); saved = $saved; errors = $errors; dir = 'qrcodes' } | ConvertTo-Json -Compress) "application/json; charset=utf-8"
        return
    }

    # ---- Editeur : reinitialiser toutes les surcharges ----
    if ($apiPath -ieq '/api/editor/reset') {
        if ($method -ne 'POST') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $edFile = Join-Path $Root 'admin-data.json'
        if (Test-Path -LiteralPath $edFile) { try { Remove-Item -LiteralPath $edFile -Force } catch {} }
        Send-Response $Stream 200 "OK" "{`"ok`":true}" "application/json; charset=utf-8"
        return
    }

    # Proxy KML : permet à l'éditeur de carte d'importer une carte Google My Maps
    # (le navigateur ne peut pas appeler google.com directement à cause du CORS).
    if ($apiPath -ieq '/api/kml') {
        if ($method -ne 'GET') {
            Send-Response $Stream 405 "Method Not Allowed" "{`"ok`":false}" "application/json; charset=utf-8"
            return
        }
        $query = ($target -split '\?')[1]
        $u = $null
        if ($query) {
            foreach ($pair in ($query -split '&')) {
                $kv = $pair -split '=', 2
                if ($kv[0] -eq 'u') { $u = [System.Net.WebUtility]::UrlDecode($kv[1]); break }
            }
        }
        $okUri = $false
        try {
            $uri = [System.Uri]$u
            $okUri = ($uri.Host -ieq 'www.google.com' -and $uri.AbsolutePath -ieq '/maps/d/kml')
        } catch { $okUri = $false }
        if (-not $okUri) {
            Send-Response $Stream 400 "Bad Request" "{`"ok`":false,`"error`":`"url-not-allowed`"}" "application/json; charset=utf-8"
            return
        }
        try {
            $req = [System.Net.HttpWebRequest]::Create($uri)
            $req.Method = 'GET'
            $req.Timeout = 15000
            $req.ReadWriteTimeout = 15000
            $resp = $req.GetResponse()
            try {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream(), [System.Text.Encoding]::UTF8)
                $kmlBody = $reader.ReadToEnd()
                $reader.Dispose()
            } finally { $resp.Dispose() }
            Send-Response $Stream 200 "OK" $kmlBody "text/xml; charset=utf-8"
        } catch {
            Send-Response $Stream 502 "Bad Gateway" "{`"ok`":false,`"error`":`"kml-fetch-failed`"}" "application/json; charset=utf-8"
        }
        return
    }

    $path = Resolve-PathSafe $target
        if ($null -eq $path) {
            Send-Response $Stream 404 "Not Found" "<h1>404 Not Found</h1><p>$([System.Net.WebUtility]::HtmlEncode($target))</p>"
            return
        }
        $item = Get-Item -LiteralPath $path
        if ($item.PSIsContainer) {
            $idx = Join-Path $path 'index.html'
            if (Test-Path -LiteralPath $idx) { $path = $idx } else {
                Send-Response $Stream 403 "Forbidden" "<h1>403 Forbidden</h1>"
                return
            }
        }
        Send-File $Stream $path
    } catch {} finally {
        try { $Stream.Dispose() } catch {}
        try { $Client.Close() } catch {}
    }
}

function Resolve-PathSafe([string]$RelativeUrl) {
    $relative = $RelativeUrl -replace '^\?.*$', ''
    $relative = $relative -replace '^https?://[^/]+', ''
    if ($relative -eq '/' -or $relative -eq '') { $relative = '/index.html' }
    if ($relative -ieq '/dashboard') { $relative = '/dashboard.html' }
    if ($relative -ieq '/editeur') { $relative = '/editeur.html' }
    if ($relative -ieq '/catalogue') { $relative = '/catalogue.html' }
    if ($relative -ieq '/atelier') { $relative = '/atelier.html' }
    if ($relative -ieq '/studio') { $relative = '/studio.html' }
    if ($relative -ieq '/hub') { $relative = '/hub/app.html' }
    $parts = $relative.Split('?')[0].Split('#')[0]
    # Décode les URL encodées (ex : Chouette%20hulotte.png) : indispensable pour
    # les images à espaces ET pour le service worker (cache hors-ligne).
    try { $parts = [System.Uri]::UnescapeDataString($parts) } catch {}
    $full = [System.IO.Path]::GetFullPath((Join-Path $Root $parts.TrimStart('/')))
    if ($full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full)) {
        return $full
    }
    return $null
}

function Send-HttpsRedirect([System.Net.Sockets.TcpClient]$Client, [int]$HttpsPort) {
    try {
        $stream = $Client.GetStream()
        $stream.ReadTimeout = 8000
        $request = Read-RequestHead $Client
        $target = "/"
        $hostHeader = ""
        foreach ($line in ($request -split "`r`n")) {
            if ($line -match '^(GET|HEAD)\s+(\S+)') {
                $target = $Matches[2]
            } elseif ($line -match '^Host:\s*([^:]+)') {
                $hostHeader = $Matches[1].Trim()
            }
        }
        if ($hostHeader -eq "") { $hostHeader = Get-LocalIPv4 }
        $loc = "https://${hostHeader}:${HttpsPort}${target}"
        $esc = [System.Net.WebUtility]::HtmlEncode($loc)
        $body = "<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'/><meta http-equiv='refresh' content='0;url=$esc'/><title>Redirection HTTPS</title></head><body style='font-family:sans-serif;text-align:center;margin-top:12%'><h2>Redirection vers la version securisee</h2><p>Chargement de la connexion HTTPS (GPS et appareil photo autorises)...</p><p><a href='$esc'>Continuer vers $esc</a></p></body></html>"
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
        $header = "HTTP/1.1 301 Moved Permanently`r`nServer: jdp-server`r`nX-Content-Type-Options: nosniff`r`nLocation: $loc`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($bodyBytes.Length)`r`nConnection: close`r`n`r`n"
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
        $stream.Flush()
    } catch {}
}

$ip = Get-LocalIPv4
$cert = $null
if (-not $NoHttps) { $cert = Get-Certificate }

$httpListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
$httpsListener = $null
if ($cert) { $httpsListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $HttpsPort) }

try {
    $httpListener.Start()
    if ($httpsListener) { $httpsListener.Start() }
} catch {
    Write-Host "  ERREUR : impossible d'utiliser le port $Port / $HttpsPort." -ForegroundColor Red
    Write-Host "  Il est peut-etre deja utilise. Lancez avec : -Port 8081 -HttpsPort 8444" -ForegroundColor Red
    exit 1
}

try {
    $rule = Get-NetFirewallRule -DisplayName "jdp-server" -ErrorAction Stop
} catch {
    try {
        New-NetFirewallRule -DisplayName "jdp-server" -Direction Inbound -Protocol TCP -LocalPort $Port,$HttpsPort -Action Allow -Profile Private,Public -ErrorAction Stop | Out-Null
        Write-Host "  Pare-feu : regle d'acces entrant creee pour les ports $Port et $HttpsPort" -ForegroundColor Yellow
    } catch {
        Write-Host "  Pare-feu : l'acces reseau peut etre bloque. Lancez ceci en mode administrateur :" -ForegroundColor Yellow
        Write-Host "    netsh advfirewall firewall add rule name=`"jdp-server`" dir=in action=allow protocol=TCP localport=$Port,$HttpsPort" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  Serveur jdp v2 demarre" -ForegroundColor Green
Write-Host "  Repertoire      : $Root"
if ($cert) {
    Write-Host "  Acces local     : https://localhost:$HttpsPort" -ForegroundColor Cyan
    Write-Host "  Acces reseau    : https://$ip`:$HttpsPort" -ForegroundColor Cyan
    Write-Host "  (http://...:$Port redirige automatiquement vers HTTPS)"
    Write-Host ""
    Write-Host "  GPS / CAMERA : le navigateur demandera l'autorisation" -ForegroundColor Yellow
    Write-Host "  sur chaque appareil. Au 1er acces, accepter l'avertissement" -ForegroundColor Yellow
    Write-Host "  de certificat (Avance -> Continuer vers le site)." -ForegroundColor Yellow
} else {
    Write-Host "  Mode HTTP (certificat indisponible) :" -ForegroundColor Yellow
    Write-Host "  Acces local     : http://localhost:$Port" -ForegroundColor Cyan
    Write-Host "  Acces reseau    : http://$ip`:$Port" -ForegroundColor Cyan
    Write-Host "  GPS et camera limites a localhost (ou flags navigateur) :" -ForegroundColor Yellow
    Write-Host "    Chrome: chrome://flags -> Unsafely treat insecure origin as secure" -ForegroundColor Yellow
    Write-Host "    Firefox: about:config -> dom.securecontext.allowlist" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Ctrl+C pour arreter"
Write-Host ""

if ($script:ServerMode.internet) {
    Write-Host "  Mode Internet demande : demarrage du tunnel public..." -ForegroundColor Yellow
    Start-Tunnel
}

try {
    while ($true) {
        while ($httpListener.Pending()) {
            $c = $httpListener.AcceptTcpClient()
            if ($cert) {
                try { Send-HttpsRedirect $c $HttpsPort } catch {}
            } else {
                # Mode HTTP seul (-NoHttps) : sert le contenu directement
                try { Handle-Client $c } catch {}
            }
            try { $c.Close() } catch {}
        }
        if ($httpsListener) {
            while ($httpsListener.Pending()) {
                $c = $httpsListener.AcceptTcpClient()
                $ssl = $null
                try {
                    $ssl = New-Object System.Net.Security.SslStream($c.GetStream(), $false)
                    # Tls12 explicite : c'est le seul mode fiable sur .NET Framework
                    # (Default/Ssl3/Tls 1.0 échouent avec "Aucun algorithme commun" ou
                    # "Echec d'un appel a SSPI" avec les navigateurs modernes).
                    $ssl.AuthenticateAsServer($cert, $false, [System.Security.Authentication.SslProtocols]::Tls12, $false)
                    Handle-Client $c $ssl
                } catch {
                    $peer = try { $c.Client.RemoteEndPoint.ToString() } catch { "inconnu" }
                    $detail = if ($_.Exception.InnerException) { " | " + $_.Exception.InnerException.Message } else { "" }
                    Write-Host ("  [HTTPS] Connexion TLS ignoree (client $peer) : " + $_.Exception.Message + $detail) -ForegroundColor DarkYellow
                } finally {
                    try { if ($ssl) { $ssl.Dispose() } } catch {}
                    try { $c.Close() } catch {}
                }
            }
        }
        Poll-Tunnel
        Start-Sleep -Milliseconds 25
    }
} finally {
    Stop-Tunnel
    try { $httpListener.Stop() } catch {}
    try { if ($httpsListener) { $httpsListener.Stop() } } catch {}
    Write-Host "`n  Serveur arrete."
}
