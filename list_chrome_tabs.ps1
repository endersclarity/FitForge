# List all Chrome tabs to see what's open
try {
    $chrome_tabs = Invoke-RestMethod -Uri "http://localhost:9222/json"
    Write-Host "Found $($chrome_tabs.Count) Chrome tabs:"
    
    for ($i = 0; $i -lt $chrome_tabs.Count; $i++) {
        $tab = $chrome_tabs[$i]
        Write-Host "Tab $($i + 1):"
        Write-Host "  Title: $($tab.title)"
        Write-Host "  URL: $($tab.url)"
        Write-Host "  ID: $($tab.id)"
        Write-Host ""
    }
    
    # Try to find any tab that might be FitForge
    $possible_tabs = $chrome_tabs | Where-Object { 
        $_.url -like "*fitforge*" -or 
        $_.url -like "*ondigitalocean*" -or 
        $_.title -like "*FitForge*" -or
        $_.title -like "*Fitness*"
    }
    
    if ($possible_tabs) {
        Write-Host "Possible FitForge tabs found:"
        $possible_tabs | ForEach-Object {
            Write-Host "  $($_.title) - $($_.url)"
        }
    } else {
        Write-Host "No obvious FitForge tabs found"
    }
    
} catch {
    Write-Host "Error connecting to Chrome DevTools: $($_.Exception.Message)"
    Write-Host "Chrome may not be running with debugging enabled"
}