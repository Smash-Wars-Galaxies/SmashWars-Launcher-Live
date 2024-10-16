# Self-elevate the script if required
if (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] 'Administrator')) {
    if ([int](Get-CimInstance -Class Win32_OperatingSystem | Select-Object -ExpandProperty BuildNumber) -ge 6000) {
        $CommandLine = "-File `"" + $MyInvocation.MyCommand.Path + "`" " + $MyInvocation.UnboundArguments
        Start-Process -FilePath PowerShell.exe -Verb Runas -ArgumentList $CommandLine -WorkingDirectory $PSScriptRoot -Wait
        Exit
    }
}

# Ensure we're in the correct directory
Set-Location $PSScriptRoot
Write-Host "Current directory: $PSScriptRoot"

# Your original script starts here
Write-Host "Running with Administrator privileges"

# Load the .env file
$envFile = ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile | ForEach-Object { $_.Trim() }

    # Extract the GH_TOKEN value
    $ghToken = $envContent | Where-Object { $_ -match '^GH_TOKEN=' } | ForEach-Object { $_ -replace '^GH_TOKEN=', '' }

    # Set the environment variable
    $env:GH_TOKEN = $ghToken

    # Output confirmation
    Write-Host "GH_TOKEN has been set."

    # Install dependencies
    npm install

    # Run the deploy script
    npm run deploy
} else {
    Write-Host "Error: .env file not found."
}

# Keep the window open
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
