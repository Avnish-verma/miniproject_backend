try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $docPath = (Resolve-Path "ShiftAura_Mini_Project_Report.docx").Path
    $pdfPath = [System.IO.Path]::ChangeExtension($docPath, ".complete.pdf")
    $doc = $word.Documents.Open($docPath)
    $doc.SaveAs([ref]$pdfPath, [ref]17)
    $doc.Close()
    $word.Quit()
    Write-Host "SUCCESS: Generated complete PDF via Word: $pdfPath"
} catch {
    Write-Host "NOTE: Word COM automation unavailable ($($_.Exception.Message))"
}
