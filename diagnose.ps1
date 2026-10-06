# Music Library System Diagnostic Script for Windows 11
# Usage: .\diagnose.ps1
# Purpose: Diagnose system components without making any changes

Write-Host "🔍 Music Library System Diagnostic Report" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Function to write status with emoji
function Write-Status {
    param(
        [string]$Message,
        [bool]$Success,
        [string]$Details = ""
    )
    
    $emoji = if ($Success) { "✅" } else { "❌" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "$emoji $Message" -ForegroundColor $color
    if ($Details) {
        Write-Host "   └─ $Details" -ForegroundColor Gray
    }
}

# 1. Check Administrator Privileges
Write-Host "1. Administrator Privileges Check" -ForegroundColor Yellow
try {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    Write-Status "Administrator privileges" $isAdmin $(if ($isAdmin) { "Running as Administrator" } else { "Run PowerShell as Administrator for full diagnostics" })
} catch {
    Write-Status "Administrator check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 2. MySQL Services Check
Write-Host "2. MySQL Services Check" -ForegroundColor Yellow
try {
    $mysqlServices = Get-Service *mysql* -ErrorAction SilentlyContinue
    if ($mysqlServices) {
        Write-Status "MySQL services found" $true "Found $($mysqlServices.Count) MySQL service(s)"
        foreach ($service in $mysqlServices) {
            $isRunning = $service.Status -eq "Running"
            Write-Status "Service: $($service.Name)" $isRunning "Status: $($service.Status)"
        }
        
        # Check specifically for MySQL80
        $mysql80 = $mysqlServices | Where-Object { $_.Name -eq "MySQL80" }
        if ($mysql80) {
            $mysql80Running = $mysql80.Status -eq "Running"
            Write-Status "MySQL80 service" $mysql80Running "Status: $($mysql80.Status)"
        } else {
            Write-Status "MySQL80 service" $false "MySQL80 service not found"
        }
    } else {
        Write-Status "MySQL services" $false "No MySQL services found"
    }
} catch {
    Write-Status "MySQL services check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 3. MySQL Port 3306 Check
Write-Host "3. MySQL Port 3306 Check" -ForegroundColor Yellow
try {
    # Test network connection
    $netTest = Test-NetConnection -ComputerName "127.0.0.1" -Port 3306 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    Write-Status "Port 3306 network connectivity" $netTest.TcpTestSucceeded $(if ($netTest.TcpTestSucceeded) { "Port is open and accepting connections" } else { "Port is not accessible" })
    
    # Check with netstat
    $netstat3306 = netstat -ano | Select-String ":3306"
    if ($netstat3306) {
        Write-Status "Port 3306 listening" $true "Found process listening on port 3306"
        Write-Host "   └─ $($netstat3306[0])" -ForegroundColor Gray
    } else {
        Write-Status "Port 3306 listening" $false "No process listening on port 3306"
    }
} catch {
    Write-Status "Port 3306 check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 4. Backend Flask Files Check
Write-Host "4. Backend Flask Files Check" -ForegroundColor Yellow
try {
    $backendPath = ".\backend"
    $appPyExists = Test-Path "$backendPath\app.py"
    Write-Status "Backend app.py exists" $appPyExists $(if ($appPyExists) { "Found at $backendPath\app.py" } else { "app.py not found in backend directory" })
    
    # Check if Flask can be imported (requires Python)
    if ($appPyExists) {
        try {
            $flaskTest = python -c "import flask; print('Flask import successful')" 2>&1
            $flaskImportOk = $LASTEXITCODE -eq 0
            Write-Status "Flask import test" $flaskImportOk $(if ($flaskImportOk) { "Flask can be imported" } else { "Flask import failed: $flaskTest" })
        } catch {
            Write-Status "Flask import test" $false "Python not available or Flask not installed"
        }
    }
    
    # Check .env file
    $envExists = Test-Path "$backendPath\.env"
    Write-Status "Backend .env file" $envExists $(if ($envExists) { "Found at $backendPath\.env" } else { ".env file missing" })
    
    if ($envExists) {
        $envContent = Get-Content "$backendPath\.env" -Raw
        $hasDbUrl = $envContent -match "DATABASE_URL"
        Write-Status "DATABASE_URL in .env" $hasDbUrl $(if ($hasDbUrl) { "Database URL configured" } else { "DATABASE_URL not found in .env" })
    }
} catch {
    Write-Status "Backend files check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 5. Port 5000 Check (Flask)
Write-Host "5. Flask Port 5000 Check" -ForegroundColor Yellow
try {
    # Check with netstat
    $netstat5000 = netstat -ano | Select-String ":5000"
    if ($netstat5000) {
        Write-Status "Port 5000 listening" $true "Process listening on port 5000"
        
        # Try to identify the process
        $portLine = $netstat5000[0].ToString()
        if ($portLine -match "\s+(\d+)$") {
            $pid = $matches[1]
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "   └─ Process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   └─ PID: $pid" -ForegroundColor Gray
            }
        }
    } else {
        Write-Status "Port 5000 listening" $false "No process listening on port 5000"
    }
    
    # Test network connection to port 5000
    $netTest5000 = Test-NetConnection -ComputerName "127.0.0.1" -Port 5000 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    Write-Status "Port 5000 network connectivity" $netTest5000.TcpTestSucceeded $(if ($netTest5000.TcpTestSucceeded) { "Port is accessible" } else { "Port is not accessible" })
} catch {
    Write-Status "Port 5000 check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 6. Flask HTTP Response Check
Write-Host "6. Flask HTTP Response Check" -ForegroundColor Yellow
try {
    # Test with curl.exe
    $curlAvailable = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curlAvailable) {
        try {
            $curlResponse = curl.exe -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/ --connect-timeout 5 2>&1
            $httpWorking = $curlResponse -match "^[2-3]\d\d$"
            Write-Status "HTTP response (curl)" $httpWorking $(if ($httpWorking) { "HTTP $curlResponse response received" } else { "No valid HTTP response: $curlResponse" })
        } catch {
            Write-Status "HTTP response (curl)" $false "curl.exe failed: $($_.Exception.Message)"
        }
    } else {
        Write-Status "curl.exe availability" $false "curl.exe not found in PATH"
    }
    
    # Test with Invoke-WebRequest as fallback
    try {
        $webResponse = Invoke-WebRequest -Uri "http://127.0.0.1:5000/" -TimeoutSec 5 -ErrorAction Stop
        Write-Status "HTTP response (PowerShell)" $true "HTTP $($webResponse.StatusCode) response received"
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "Unable to connect") {
            Write-Status "HTTP response (PowerShell)" $false "Connection refused - Flask not running or not accessible"
        } else {
            Write-Status "HTTP response (PowerShell)" $false "Error: $errorMsg"
        }
    }
} catch {
    Write-Status "HTTP response check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 7. Frontend .env File Check
Write-Host "7. Frontend Configuration Check" -ForegroundColor Yellow
try {
    $frontendPath = ".\frontend"
    $frontendEnvExists = Test-Path "$frontendPath\.env"
    Write-Status "Frontend .env file" $frontendEnvExists $(if ($frontendEnvExists) { "Found at $frontendPath\.env" } else { ".env file missing (copy from .env.example)" })
    
    if ($frontendEnvExists) {
        $frontendEnvContent = Get-Content "$frontendPath\.env" -Raw
        $hasApiUrl = $frontendEnvContent -match "VITE_API"
        Write-Status "VITE_API_* configuration" $hasApiUrl $(if ($hasApiUrl) { "API configuration found" } else { "VITE_API_BASE_URL not configured" })
        
        # Check specific API URL
        if ($frontendEnvContent -match "VITE_API_BASE_URL=(.+)") {
            $apiUrl = $matches[1].Trim()
            Write-Host "   └─ API URL: $apiUrl" -ForegroundColor Gray
        }
    }
    
    # Check if .env.example exists
    $envExampleExists = Test-Path "$frontendPath\.env.example"
    Write-Status "Frontend .env.example" $envExampleExists $(if ($envExampleExists) { "Template available" } else { ".env.example missing" })
    
    # Check package.json
    $packageJsonExists = Test-Path "$frontendPath\package.json"
    Write-Status "Frontend package.json" $packageJsonExists $(if ($packageJsonExists) { "Found" } else { "package.json missing" })
    
    # Check node_modules
    $nodeModulesExists = Test-Path "$frontendPath\node_modules"
    Write-Status "Frontend dependencies" $nodeModulesExists $(if ($nodeModulesExists) { "node_modules found" } else { "Run 'npm install' in frontend directory" })
} catch {
    Write-Status "Frontend configuration check failed" $false "Error: $($_.Exception.Message)"
}

Write-Host ""

# 8. Summary and Recommendations
Write-Host "8. Summary and Next Steps" -ForegroundColor Yellow

$issues = @()
if (-not $isAdmin) { $issues += "Run as Administrator" }
if (-not ($mysqlServices | Where-Object { $_.Status -eq "Running" })) { $issues += "Start MySQL service" }
if (-not $netTest.TcpTestSucceeded) { $issues += "Fix MySQL connection" }
if (-not $appPyExists) { $issues += "Check backend files" }
if (-not $netTest5000.TcpTestSucceeded) { $issues += "Start Flask backend" }
if (-not $frontendEnvExists) { $issues += "Create frontend .env file" }

if ($issues.Count -eq 0) {
    Write-Status "System status" $true "All components appear to be working correctly!"
} else {
    Write-Status "Issues found" $false "$($issues.Count) issue(s) need attention"
    Write-Host ""
    Write-Host "🔧 Recommended Actions:" -ForegroundColor Cyan
    $issues | ForEach-Object { Write-Host "   • $_" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "📋 Full Setup Guide: Run the main setup plan if issues found" -ForegroundColor Cyan
Write-Host "🔄 Re-run this script after making changes to verify fixes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Diagnostic completed at $(Get-Date)" -ForegroundColor Gray