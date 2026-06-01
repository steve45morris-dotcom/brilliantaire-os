# Audio Drop Inventory Report
*Scan Date: {{SCAN_DATE}}*

## 1. Directory Checked
* **Path:** `{{RECORDINGS_PATH}}`

## 2. Files Found
* **Total Files:** `{{TOTAL_FILES}}`
* **Allowed Audio Files:** `{{ALLOWED_FILES_COUNT}}`

## 3. Format Breakdown
* **Unsupported Files:** `{{UNSUPPORTED_FILES_COUNT}}`
* **Oversized Files (>100MB):** `{{OVERSIZED_FILES_COUNT}}`

## 4. File Detail Inventory
| File Name | File Size (Bytes) | Format | Status |
|-----------|------------------|--------|--------|
{{FILE_ROWS}}

## 5. Duplicate Candidates
* **Count:** `{{DUPLICATE_COUNT}}`
* **Details:** `{{DUPLICATE_DETAILS}}`

## 6. Next Action
* **Recommended Next Step:** {{NEXT_ACTION}}
