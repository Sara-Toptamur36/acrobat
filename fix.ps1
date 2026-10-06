# Music Library System Fix Script - Windows 11 PowerShell
# HATA YOK MODU: Her adım doğrulanır, güvenli düzeltmeler yapılır
# Usage: .\fix.ps1 (Administrator PowerShell'de çalıştır)

param()

# Global Variables
$BACKEND_PATH = Join-Path $PSScriptRoot "backend"
$FRONTEND_PATH = Join-Path $PSScriptRoot "frontend"
$FLASK_PID = $null

# Helper Functions
function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "`n🔧 $Message" -ForegroundColor $Color
    Write-Host ("=" * ($Message.Length + 3)) -ForegroundColor $Color
}

function Write-Status {
    param([string]$Message, [bool]$Success, [string]$Details = "")
    $emoji = if ($Success) { "✅" } else { "❌" }
    $color = if ($Success) { "Green" } else { "Red" }
    Write-Host "$emoji $Message" -ForegroundColor $color
    if ($Details) { Write-Host "   └─ $Details" -ForegroundColor Gray }
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Stop-WithError {
    param([string]$Message, [string]$NextStep = "")
    Write-Host "`n❌ SCRIPT DURDURULDU" -ForegroundColor Red
    Write-Host $Message -ForegroundColor Red
    if ($NextStep) {
        Write-Host "`n🔧 Bir sonraki hamle:" -ForegroundColor Yellow
        Write-Host $NextStep -ForegroundColor Yellow
    }
    exit 1
}

# Main Script Start
Write-Host "🚀 Music Library System Fix Script" -ForegroundColor Cyan
Write-Host "Hedef: MySQL -> Backend Flask -> Frontend Vite" -ForegroundColor Cyan
Write-Host "Mod: HATA YOK - Her adım doğrulanır" -ForegroundColor Green
Write-Host ""

# A) ADMIN CONTROL
Write-Step "A) Administrator Yetkisi Kontrolü"
try {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if (-not $isAdmin) {
        Stop-WithError "Bu script Administrator yetkisi gerektirir." "PowerShell'i 'Yönetici olarak çalıştır' ile açın ve tekrar deneyin."
    }
    Write-Status "Administrator yetkisi" $true "Yetki doğrulandı"
} catch {
    Stop-WithError "Administrator kontrolü başarısız: $($_.Exception.Message)"
}

# B) MYSQL CONTROL AND FIX
Write-Step "B) MySQL Servisi Kontrolü ve Düzeltmesi"

# B1) Find MySQL Services
try {
    $mysqlServices = Get-Service *mysql* -ErrorAction SilentlyContinue
    if (-not $mysqlServices) {
        Stop-WithError "MySQL servisi bulunamadı." "MySQL'i yükleyin veya servis adını kontrol edin."
    }
    Write-Status "MySQL servisleri bulundu" $true "Toplam $($mysqlServices.Count) servis"
    
    # B2) Select MySQL Service (Priority: MySQL80)
    $targetService = $mysqlServices | Where-Object { $_.Name -eq "MySQL80" } | Select-Object -First 1
    if (-not $targetService) {
        $targetService = $mysqlServices | Select-Object -First 1
        Write-Warning "MySQL80 bulunamadı, $($targetService.Name) kullanılacak"
    } else {
        Write-Info "MySQL80 servisi seçildi"
    }
    
    # B3) Check and Start Service
    Write-Info "Servis durumu kontrol ediliyor: $($targetService.Name)"
    $serviceStatus = Get-Service $targetService.Name
    Write-Status "Servis durumu" ($serviceStatus.Status -eq "Running") "Status: $($serviceStatus.Status)"
    
    if ($serviceStatus.Status -ne "Running") {
        Write-Info "Servis başlatılıyor..."
        try {
            Start-Service -Name $targetService.Name -ErrorAction Stop
            Start-Sleep -Seconds 3
            $serviceStatus = Get-Service $targetService.Name
            Write-Status "Servis başlatma" ($serviceStatus.Status -eq "Running") "Yeni durum: $($serviceStatus.Status)"
        } catch {
            Stop-WithError "MySQL servisi başlatılamadı: $($_.Exception.Message)" "Servisleri manuel kontrol edin: services.msc"
        }
    }
    
    # B4) Verify Port 3306
    Write-Info "Port 3306 bağlantısı test ediliyor..."
    try {
        $netTest = Test-NetConnection -ComputerName "127.0.0.1" -Port 3306 -WarningAction SilentlyContinue -ErrorAction Stop
        Write-Status "Port 3306 erişimi" $netTest.TcpTestSucceeded "Bağlantı durumu: $($netTest.TcpTestSucceeded)"
        
        if (-not $netTest.TcpTestSucceeded) {
            $netstatOutput = netstat -ano | Select-String ":3306"
            if ($netstatOutput) {
                Write-Info "Port 3306 netstat çıktısı:"
                $netstatOutput | ForEach-Object { Write-Host "   $($_)" -ForegroundColor Gray }
            }
            Stop-WithError "Port 3306 erişilebilir değil." "MySQL konfigürasyonunu kontrol edin veya firewall ayarlarını gözden geçirin."
        }
    } catch {
        Stop-WithError "Port 3306 testi başarısız: $($_.Exception.Message)"
    }
    
} catch {
    Stop-WithError "MySQL kontrolü başarısız: $($_.Exception.Message)"
}

# C) BACKEND FLASK CONTROL AND FIX
Write-Step "C) Backend Flask Kontrolü ve Başlatması"

# C1) Check Backend Directory
if (-not (Test-Path $BACKEND_PATH)) {
    Stop-WithError "Backend klasörü bulunamadı: $BACKEND_PATH"
}
Write-Status "Backend klasörü" $true "Yol: $BACKEND_PATH"

# C2) Detect Flask Entry Point
Set-Location $BACKEND_PATH
$flaskEntry = $null
if (Test-Path "app.py") {
    $flaskEntry = "app.py"
    Write-Status "Flask entry point" $true "app.py bulundu"
} elseif (Test-Path "main.py") {
    $flaskEntry = "main.py"
    Write-Status "Flask entry point" $true "main.py bulundu"
} elseif (Test-Path "app\__init__.py") {
    $flaskEntry = "app"
    Write-Status "Flask entry point" $true "app modülü bulundu"
} else {
    Stop-WithError "Flask entry point bulunamadı." "app.py, main.py veya app/__init__.py dosyalarından birini oluşturun."
}

# C3) Clean Flask Environment Variables
Write-Info "Flask environment değişkenleri temizleniyor..."
Get-ChildItem Env:FLASK_* -ErrorAction SilentlyContinue | Remove-Item -ErrorAction SilentlyContinue
Write-Status "Environment temizleme" $true "FLASK_* değişkenleri temizlendi"

# C4) Check if Port 5000 is Already in Use
$port5000Check = netstat -ano | Select-String ":5000.*LISTENING"
if ($port5000Check) {
    Write-Warning "Port 5000 zaten kullanımda:"
    $port5000Check | ForEach-Object { Write-Host "   $($_)" -ForegroundColor Gray }
    Write-Info "Mevcut Flask process'i sonlandırılıyor..."
    
    # Try to find and kill existing Flask processes
    $flaskProcesses = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*flask*" -or $_.CommandLine -like "*5000*" }
    if ($flaskProcesses) {
        $flaskProcesses | ForEach-Object { 
            Write-Info "Process sonlandırılıyor: PID $($_.Id)"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

# C5) Start Flask Process
Write-Info "Flask başlatılıyor..."
try {
    $flaskLogPath = Join-Path $BACKEND_PATH "flask.log"
    $flaskCmd = "python -m flask run --host 127.0.0.1 --port 5000"
    
    # Set FLASK_APP environment variable
    $env:FLASK_APP = $flaskEntry
    
    Write-Info "Komut: $flaskCmd"
    Write-Info "FLASK_APP: $flaskEntry"
    Write-Info "Log dosyası: $flaskLogPath"
    
    $flaskProcess = Start-Process -FilePath "python" -ArgumentList "-m", "flask", "run", "--host", "127.0.0.1", "--port", "5000" -PassThru -RedirectStandardOutput $flaskLogPath -RedirectStandardError $flaskLogPath -WorkingDirectory $BACKEND_PATH
    $FLASK_PID = $flaskProcess.Id
    Write-Status "Flask process başlatma" $true "PID: $FLASK_PID"
    
    # C6) Wait and Verify Flask
    Write-Info "Flask başlatması için 5 saniye bekleniyor..."
    Start-Sleep -Seconds 5
    
    # Check if process is still running
    $processRunning = Get-Process -Id $FLASK_PID -ErrorAction SilentlyContinue
    Write-Status "Flask process durumu" ($null -ne $processRunning) $(if ($processRunning) { "Çalışıyor" } else { "Sonlandı" })
    
    # Check port 5000
    $netstat5000 = netstat -ano | Select-String ":5000.*LISTENING"
    Write-Status "Port 5000 dinleme" ($null -ne $netstat5000) $(if ($netstat5000) { "Aktif" } else { "Kapalı" })
    
    if ($netstat5000) {
        Write-Host "   └─ $($netstat5000[0])" -ForegroundColor Gray
    }
    
    # Test network connection
    try {
        $netTest5000 = Test-NetConnection -ComputerName "127.0.0.1" -Port 5000 -WarningAction SilentlyContinue -ErrorAction Stop
        Write-Status "Port 5000 bağlantı testi" $netTest5000.TcpTestSucceeded "Erişilebilir: $($netTest5000.TcpTestSucceeded)"
    } catch {
        Write-Status "Port 5000 bağlantı testi" $false "Test başarısız"
    }
    
    # Test HTTP Response
    Write-Info "HTTP yanıtı test ediliyor..."
    try {
        $curlOutput = curl.exe -i -s --connect-timeout 5 http://127.0.0.1:5000/ 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "HTTP yanıtı" $true "Başarılı"
            Write-Info "İlk 3 satır:"
            ($curlOutput | Select-Object -First 3) | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        } else {
            Write-Status "HTTP yanıtı" $false "curl başarısız: $curlOutput"
        }
    } catch {
        Write-Status "HTTP yanıtı" $false "Test başarısız: $($_.Exception.Message)"
    }
    
    # If Flask is not responding, show log and stop
    if (-not $netstat5000 -or -not $processRunning) {
        Write-Warning "Flask başlatılamadı. Log dosyası kontrol ediliyor..."
        if (Test-Path $flaskLogPath) {
            Write-Host "Flask log içeriği:" -ForegroundColor Yellow
            Get-Content $flaskLogPath -ErrorAction SilentlyContinue | Select-Object -Last 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
        Stop-WithError "Flask başlatılamadı." "Log dosyasını inceleyin: $flaskLogPath"
    }
    
} catch {
    Stop-WithError "Flask başlatma başarısız: $($_.Exception.Message)"
}

# D) DATABASE CONFIG VERIFICATION
Write-Step "D) Database Konfigürasyon Doğrulaması"

# D1) Check Database Configuration
try {
    $configFiles = @("config.py", ".env", "app.py")
    $dbConfigFound = $false
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
            $dbMatches = Select-String -InputObject $content -Pattern "(SQLALCHEMY_DATABASE_URI|DATABASE_URL)" -AllMatches
            if ($dbMatches) {
                Write-Status "DB config in $file" $true "Konfigürasyon bulundu"
                $dbConfigFound = $true
                $dbMatches.Matches | ForEach-Object { 
                    $line = $_.Line.Trim()
                    if ($line.Length -gt 80) { $line = $line.Substring(0, 80) + "..." }
                    Write-Host "   └─ $line" -ForegroundColor Gray 
                }
            }
        }
    }
    
    Write-Status "Database konfigürasyonu" $dbConfigFound $(if ($dbConfigFound) { "Bulundu" } else { "Bulunamadı" })
    
    # D2) Check PyMySQL Driver
    Write-Info "PyMySQL driver kontrolü..."
    try {
        $pymysqlTest = python -c "import pymysql; print('PyMySQL OK')" 2>&1
        $pymysqlOk = $LASTEXITCODE -eq 0
        Write-Status "PyMySQL driver" $pymysqlOk $(if ($pymysqlOk) { "Yüklü" } else { "Eksik - pip install pymysql çalıştırın" })
    } catch {
        Write-Status "PyMySQL driver" $false "Test başarısız"
    }
    
} catch {
    Write-Status "Database config kontrolü" $false "Hata: $($_.Exception.Message)"
}

# E) FRONTEND CONFIGURATION
Write-Step "E) Frontend Konfigürasyonu"

# E1) Check Frontend Directory
if (-not (Test-Path $FRONTEND_PATH)) {
    Stop-WithError "Frontend klasörü bulunamadı: $FRONTEND_PATH"
}
Write-Status "Frontend klasörü" $true "Yol: $FRONTEND_PATH"

Set-Location $FRONTEND_PATH

# E2) Handle .env File
$envPath = ".env"
$envExamplePath = ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Info ".env dosyası bulunamadı, oluşturuluyor..."
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Status ".env dosyası" $true ".env.example'dan kopyalandı"
    } else {
        # Create basic .env file
        $basicEnv = @"
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:5000

# Development Configuration
VITE_APP_NAME="Music Catalog Manager"
VITE_APP_VERSION=1.0.0
"@
        Set-Content -Path $envPath -Value $basicEnv -Encoding UTF8
        Write-Status ".env dosyası" $true "Temel konfigürasyon ile oluşturuldu"
    }
} else {
    Write-Status ".env dosyası" $true "Mevcut"
}

# E3) Verify/Add VITE_API_BASE_URL
$envContent = Get-Content $envPath -Raw -ErrorAction SilentlyContinue
$hasApiUrl = $envContent -match "VITE_API.*URL"

if (-not $hasApiUrl) {
    Write-Info "VITE_API_BASE_URL ekleniyor..."
    Add-Content -Path $envPath -Value "`nVITE_API_BASE_URL=http://127.0.0.1:5000" -Encoding UTF8
    Write-Status "VITE_API_BASE_URL" $true "Eklendi"
} else {
    Write-Status "VITE_API_BASE_URL" $true "Mevcut"
    # Show current API URL
    $apiUrlMatch = [regex]::Match($envContent, "VITE_API.*URL\s*=\s*(.+)")
    if ($apiUrlMatch.Success) {
        Write-Host "   └─ Değer: $($apiUrlMatch.Groups[1].Value.Trim())" -ForegroundColor Gray
    }
}

# E4) Check node_modules and package.json
$packageJsonExists = Test-Path "package.json"
$nodeModulesExists = Test-Path "node_modules"

Write-Status "package.json" $packageJsonExists $(if ($packageJsonExists) { "Bulundu" } else { "Eksik" })
Write-Status "node_modules" $nodeModulesExists $(if ($nodeModulesExists) { "Bulundu" } else { "npm install gerekli" })

if ($packageJsonExists -and -not $nodeModulesExists) {
    Write-Info "npm install çalıştırılıyor..."
    try {
        $npmOutput = npm install 2>&1
        $npmSuccess = $LASTEXITCODE -eq 0
        Write-Status "npm install" $npmSuccess $(if ($npmSuccess) { "Başarılı" } else { "Başarısız" })
        if (-not $npmSuccess) {
            Write-Host "npm çıktısı:" -ForegroundColor Yellow
            ($npmOutput | Select-Object -Last 5) | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    } catch {
        Write-Status "npm install" $false "Hata: $($_.Exception.Message)"
    }
}

# F) FINAL REPORT AND RECOMMENDATIONS
Write-Step "F) Final Durum Raporu"

# F1) System Status Summary
Write-Host "🎯 Sistem Durumu Özeti:" -ForegroundColor Cyan

# MySQL Status
$mysqlFinal = Get-Service $targetService.Name -ErrorAction SilentlyContinue
$mysql3306 = Test-NetConnection -ComputerName "127.0.0.1" -Port 3306 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
Write-Status "MySQL (3306)" ($mysqlFinal.Status -eq "Running" -and $mysql3306.TcpTestSucceeded) "Servis: $($mysqlFinal.Status), Port: $($mysql3306.TcpTestSucceeded)"

# Flask Status
$flask5000 = Test-NetConnection -ComputerName "127.0.0.1" -Port 5000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
$flaskProcessCheck = if ($FLASK_PID) { Get-Process -Id $FLASK_PID -ErrorAction SilentlyContinue } else { $null }
Write-Status "Flask (5000)" ($flask5000.TcpTestSucceeded -and $flaskProcessCheck) "Port: $($flask5000.TcpTestSucceeded), Process: $($null -ne $flaskProcessCheck)"

# Frontend Status
$frontendEnvCheck = Test-Path "$FRONTEND_PATH\.env"
Write-Status "Frontend (.env)" $frontendEnvCheck "Konfigürasyon: $frontendEnvCheck"

# F2) Next Steps
Write-Host "`n🚀 Sonraki Adımlar:" -ForegroundColor Cyan

if ($flask5000.TcpTestSucceeded) {
    Write-Host "✅ Backend hazır! Test URL: http://127.0.0.1:5000/" -ForegroundColor Green
} else {
    Write-Host "❌ Backend sorunlu. Log kontrol edin: $BACKEND_PATH\flask.log" -ForegroundColor Red
}

if ($frontendEnvCheck) {
    Write-Host "✅ Frontend konfigürasyonu hazır!" -ForegroundColor Green
    Write-Host "   Frontend başlatmak için:" -ForegroundColor Yellow
    Write-Host "   cd $FRONTEND_PATH" -ForegroundColor Yellow
    Write-Host "   npm run dev -- --port 3001" -ForegroundColor Yellow
} else {
    Write-Host "❌ Frontend konfigürasyonu eksik" -ForegroundColor Red
}

# F3) Process Information
if ($FLASK_PID) {
    Write-Host "`n📋 Çalışan Processler:" -ForegroundColor Cyan
    Write-Host "Flask PID: $FLASK_PID" -ForegroundColor Gray
    Write-Host "Flask'ı durdurmak için: Stop-Process -Id $FLASK_PID" -ForegroundColor Gray
}

# F4) Last Resort Recommendations (NOT AUTOMATED)
Write-Host "`n⚠️  Son Çare Önerileri (Manuel):" -ForegroundColor Yellow
Write-Host "• Windows Firewall: Port 3306 ve 5000 için kural ekleyin" -ForegroundColor Gray
Write-Host "• Windows Defender: Python.exe ve mysql için istisna ekleyin" -ForegroundColor Gray
Write-Host "• MySQL Reinstall: Eğer servis sürekli başarısız oluyorsa" -ForegroundColor Gray
Write-Host "• Registry: HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\MySQL80" -ForegroundColor Gray

Write-Host "`n🎉 Fix script tamamlandı!" -ForegroundColor Green
Write-Host "Sorun devam ederse diagnose.ps1 ile detaylı kontrol yapın." -ForegroundColor Cyan

# Return to original directory
Set-Location $PSScriptRoot