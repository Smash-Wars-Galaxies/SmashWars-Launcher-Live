# File: deploy.ps1

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

    # Run the deploy script
    npm run deploy
} else {
    Write-Host "Error: .env file not found."
}
