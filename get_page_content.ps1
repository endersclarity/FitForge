# Get FitForge page content through Chrome automation
$chrome_tabs = Invoke-RestMethod -Uri "http://localhost:9222/json"
Write-Host "Found $($chrome_tabs.Count) Chrome tabs"

# Look for FitForge tab
$fitforge_tab = $chrome_tabs | Where-Object { $_.url -like "*fitforge*" }

if ($fitforge_tab) {
    Write-Host "Found FitForge tab: $($fitforge_tab.title)"
    Write-Host "URL: $($fitforge_tab.url)"
    
    # Get page content
    $eval_body = @{
        expression = "document.body.innerText"
        returnByValue = $true
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $eval_body -ContentType "application/json"
    
    if ($response.result.value) {
        Write-Host "Page content:"
        Write-Host $response.result.value
    }
    
    # Get page title
    $title_body = @{
        expression = "document.title"
        returnByValue = $true
    } | ConvertTo-Json
    
    $title_response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $title_body -ContentType "application/json"
    Write-Host "Page title: $($title_response.result.value)"
    
    # Try to get main elements
    $elements_body = @{
        expression = "Array.from(document.querySelectorAll('h1, h2, h3, button, [role=button]')).map(el => ({tag: el.tagName, text: el.innerText.substring(0, 100), class: el.className})).slice(0, 20)"
        returnByValue = $true
    } | ConvertTo-Json
    
    $elements_response = Invoke-RestMethod -Uri "http://localhost:9222/runtime/evaluate" -Method Post -Body $elements_body -ContentType "application/json"
    if ($elements_response.result.value) {
        Write-Host "Main elements found:"
        $elements_response.result.value | ForEach-Object {
            Write-Host "  $($_.tag): $($_.text)"
        }
    }
    
} else {
    Write-Host "No FitForge tab found. Opening FitForge..."
    Start-Process chrome "https://fitforge-free-9zezd.ondigitalocean.app"
    Start-Sleep 5
    Write-Host "FitForge should now be open in Chrome"
}