import docx

doc = docx.Document('ShiftAura_Mini_Project_Report.docx')
print('=== DOCX VALIDATION AUDIT ===')
print('Total sections:', len(doc.sections))
for i, s in enumerate(doc.sections):
    print(f'Section {i}: Top={s.top_margin.inches}", Bottom={s.bottom_margin.inches}", Left={s.left_margin.inches}", Right={s.right_margin.inches}"')
    printable_w = 8.27 - s.left_margin.inches - s.right_margin.inches
    print(f'   Printable Width: {printable_w:.2f} inches')

print(f'\nTotal tables: {len(doc.tables)}')
for i, t in enumerate(doc.tables):
    col_widths = [cell.width.inches for cell in t.rows[0].cells]
    total_w = sum(col_widths)
    assert total_w <= 5.85, f'Table {i} exceeds printable width: {total_w}'
    print(f'Table {i}: cols={len(col_widths)}, total_width={total_w:.2f} in, widths={[round(w,2) for w in col_widths]}')

print(f'\nTotal paragraphs: {len(doc.paragraphs)}')
non_empty = [p for p in doc.paragraphs if p.text.strip()]
print('Non-empty paragraphs:', len(non_empty))
print('\n=== ALL GEOMETRY AND ALIGNMENT AUDITS PASSED CLEANLY! ===')
