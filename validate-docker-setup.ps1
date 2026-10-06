# Docker Setup Validation Script
# Validates Docker configuration without running containers

param(
    [switch]$Verbose
)

Write-Host "Docker Setup Validation" -ForegroundColor Cyan
Write-Host ""

$ValidationResults = @()

# Function to add validation result
function Add-ValidationResult {
    param($Test, $Status, $Message, $Details = "")
    $script:ValidationResults += [PSCustomObject]@{
        Test = $Test
        Status = $Status
        Message = $Message
        Details = $Details
    }
}

# Check if Docker is available
Write-Host "1. Checking Docker availability..." -ForegroundColor Yellow
try {
    $DockerVersion = docker --version 2>$null
    if ($DockerVersion) {
        Add-ValidationResult "Docker Installation" "PASS" "Docker is installed: $DockerVersion"
    } else {
        Add-ValidationResult "Docker Installation" "FAIL" "Docker command not found" "Install Docker Desktop from https://docker.com"
    }
} catch {
    Add-ValidationResult "Docker Installation" "FAIL" "Docker not available" "Install Docker Desktop and ensure it's running"
}

# Check docker-compose.yml
Write-Host "2. Validating docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    try {
        $ComposeContent = Get-Content "docker-compose.yml" -Raw
        
        # Check for required services
        $RequiredServices = @("mysql", "backend", "frontend")
        $MissingServices = @()
        
        foreach ($Service in $RequiredServices) {
            if ($ComposeContent -notmatch "${Service}:") {
                $MissingServices += $Service
            }
        }
        
        if ($MissingServices.Count -eq 0) {
            Add-ValidationResult "Docker Compose Services" "PASS" "All required services defined (mysql, backend, frontend)"
        } else {
            Add-ValidationResult "Docker Compose Services" "FAIL" "Missing services: $($MissingServices -join ', ')"
        }
        
        # Check for networks
        if ($ComposeContent -match "networks:") {
            Add-ValidationResult "Docker Networks" "PASS" "Network configuration found"
        } else {
            Add-ValidationResult "Docker Networks" "WARN" "No network configuration found"
        }
        
        # Check for volumes
        if ($ComposeContent -match "volumes:") {
            Add-ValidationResult "Docker Volumes" "PASS" "Volume configuration found"
        } else {
            Add-ValidationResult "Docker Volumes" "WARN" "No volume configuration found"
        }
        
    } catch {
        Add-ValidationResult "Docker Compose Validation" "FAIL" "Failed to parse docker-compose.yml: $_"
    }
} else {
    Add-ValidationResult "Docker Compose File" "FAIL" "docker-compose.yml not found"
}

# Check Dockerfiles
Write-Host "3. Validating Dockerfiles..." -ForegroundColor Yellow

# Backend Dockerfile
if (Test-Path "backend/Dockerfile") {
    $BackendDockerfile = Get-Content "backend/Dockerfile" -Raw
    if ($BackendDockerfile -match "FROM python:" -and $BackendDockerfile -match "EXPOSE 5000") {
        Add-ValidationResult "Backend Dockerfile" "PASS" "Backend Dockerfile is properly configured"
    } else {
        Add-ValidationResult "Backend Dockerfile" "FAIL" "Backend Dockerfile missing required configuration"
    }
} else {
    Add-ValidationResult "Backend Dockerfile" "FAIL" "backend/Dockerfile not found"
}

# Frontend Dockerfile
if (Test-Path "frontend/Dockerfile") {
    $FrontendDockerfile = Get-Content "frontend/Dockerfile" -Raw
    if ($FrontendDockerfile -match "FROM node:" -and $FrontendDockerfile -match "EXPOSE 3001") {
        Add-ValidationResult "Frontend Dockerfile" "PASS" "Frontend Dockerfile is properly configured"
    } else {
        Add-ValidationResult "Frontend Dockerfile" "FAIL" "Frontend Dockerfile missing required configuration"
    }
} else {
    Add-ValidationResult "Frontend Dockerfile" "FAIL" "frontend/Dockerfile not found"
}

# Check required project files
Write-Host "4. Validating project structure..." -ForegroundColor Yellow

$RequiredFiles = @(
    @{Path="backend/app.py"; Description="Flask application entry point"},
    @{Path="backend/requirements.txt"; Description="Python dependencies"},
    @{Path="frontend/package.json"; Description="Node.js dependencies"},
    @{Path="frontend/vite.config.js"; Description="Vite configuration"},
    @{Path="db/schema.sql"; Description="Database schema"}
)

foreach ($File in $RequiredFiles) {
    if (Test-Path $File.Path) {
        Add-ValidationResult "Project File: $($File.Path)" "PASS" $File.Description
    } else {
        Add-ValidationResult "Project File: $($File.Path)" "FAIL" "$($File.Description) not found"
    }
}

# Display results
Write-Host ""
Write-Host "Validation Results:" -ForegroundColor Cyan
Write-Host "=" * 80

$PassCount = ($ValidationResults | Where-Object { $_.Status -eq "PASS" }).Count
$FailCount = ($ValidationResults | Where-Object { $_.Status -eq "FAIL" }).Count
$WarnCount = ($ValidationResults | Where-Object { $_.Status -eq "WARN" }).Count

foreach ($Result in $ValidationResults) {
    $StatusSymbol = switch ($Result.Status) {
        "PASS" { "[PASS]" }
        "FAIL" { "[FAIL]" }
        "WARN" { "[WARN]" }
        default { "[INFO]" }
    }
    
    $Color = switch ($Result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "$StatusSymbol $($Result.Test): $($Result.Message)" -ForegroundColor $Color
    
    if ($Result.Details -and ($Verbose -or $Result.Status -eq "FAIL")) {
        Write-Host "    -> $($Result.Details)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "   Passed: $PassCount" -ForegroundColor Green
Write-Host "   Failed: $FailCount" -ForegroundColor Red
Write-Host "   Warnings: $WarnCount" -ForegroundColor Yellow

# Overall status
if ($FailCount -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Docker setup is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "   2. Run: docker compose up --build -d" -ForegroundColor White
    Write-Host "   3. Or use: .\docker-start.ps1 -Build" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Docker setup has issues that need to be resolved" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required fixes:" -ForegroundColor Yellow
    $FailedTests = $ValidationResults | Where-Object { $_.Status -eq "FAIL" }
    foreach ($Failed in $FailedTests) {
        Write-Host "   - $($Failed.Test): $($Failed.Message)" -ForegroundColor Red
        if ($Failed.Details) {
            Write-Host "     -> $($Failed.Details)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host "Docker Commands Reference:" -ForegroundColor Cyan
Write-Host "   Build and start:  docker compose up --build -d" -ForegroundColor Gray
Write-Host "   View logs:        docker compose logs -f" -ForegroundColor Gray
Write-Host "   Stop services:    docker compose down" -ForegroundColor Gray
Write-Host "   Service status:   docker compose ps" -ForegroundColor Gray
Write-Host "   Clean up:         docker compose down -v" -ForegroundColor Gray