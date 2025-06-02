# Kill existing Chrome and start fresh with debugging
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

# Start Chrome with debugging and go directly to FitForge
Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @(
    "--remote-debugging-port=9222",
    "--new-window",
    "--disable-web-security",
    "--user-data-dir=C:\temp\chrome_debug_fitforge",
    "https://fitforge-free-9zezd.ondigitalocean.app"
)

Write-Host "Starting Chrome with FitForge page..."
Start-Sleep 10

# Now check tabs
try {
    $chrome_tabs = Invoke-RestMethod -Uri "http://localhost:9222/json"
    Write-Host "Found $($chrome_tabs.Count) tabs after starting FitForge"
    
    $chrome_tabs | ForEach-Object {
        Write-Host "Tab: $($_.title) - $($_.url)"
        
        if ($_.url -like "*fitforge*" -or $_.url -like "*ondigitalocean*") {
            Write-Host "Found FitForge tab! Getting content..."
            
            # Get page title
            $title_body = @{
                expression = "document.title"
                returnByValue = $true
            } | ConvertTo-Json
            
            try {
                $title_response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $title_body -ContentType "application/json"
                Write-Host "Page title: $($title_response.result.value)"
            } catch {
                Write-Host "Could not get page title"
            }
            
            # Get visible text content
            $content_body = @{
                expression = "document.body.innerText.substring(0, 2000)"
                returnByValue = $true
            } | ConvertTo-Json
            
            try {
                $content_response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $content_body -ContentType "application/json"
                Write-Host "Page content:"
                Write-Host $content_response.result.value
            } catch {
                Write-Host "Could not get page content"
            }
            
            # Get main headings and buttons
            $elements_body = @{
                expression = "Array.from(document.querySelectorAll('h1, h2, h3, button, [role=button], nav a')).map(el => el.innerText.trim()).filter(text => text.length > 0).slice(0, 20).join(' | ')"
                returnByValue = $true
            } | ConvertTo-Json
            
            try {
                $elements_response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $elements_body -ContentType "application/json"
                Write-Host "Main elements: $($elements_response.result.value)"
            } catch {
                Write-Host "Could not get elements"
            }
        }
    }
} catch {
    Write-Host "Error accessing Chrome DevTools: $($_.Exception.Message)"
}