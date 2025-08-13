# PDFViewerModal Page Navigation Test Plan

## Regression Test for Page Navigation Bug

### Bug Description
In the attachment viewer, clicking the next/previous page buttons changes the thumbnail selection but doesn't actually scroll the PDF page being viewed.

### Root Cause Analysis
The issue was in the `scrollToPage` function:
1. The page state was updated after attempting to scroll
2. The scroll timing was unreliable with `setTimeout(..., 0)`
3. Used `scrollTo` instead of the more reliable `scrollIntoView`

### Fix Applied
1. Update page state immediately for UI responsiveness
2. Use `requestAnimationFrame` to ensure DOM updates are reflected
3. Use `scrollIntoView` with smooth behavior for reliable scrolling
4. Increased timeout for smooth scroll completion

### Manual Test Cases

#### Test Case 1: Next Page Navigation
1. Open PDF viewer modal with a multi-page PDF
2. Verify current page shows "Page 1 / N"
3. Click "Next page" button (down arrow)
4. **Expected**: Page display updates to "Page 2 / N" AND PDF scrolls to show page 2 content
5. **Previously**: Page display updated but PDF remained on page 1

#### Test Case 2: Previous Page Navigation
1. Navigate to page 2 using next page button
2. Click "Previous page" button (up arrow)
3. **Expected**: Page display updates to "Page 1 / N" AND PDF scrolls to show page 1 content

#### Test Case 3: Thumbnail Navigation
1. Click on page 3 thumbnail in sidebar
2. **Expected**: Page display updates to "Page 3 / N" AND PDF scrolls to show page 3 content

#### Test Case 4: Keyboard Navigation
1. Use arrow down key to navigate to next page
2. **Expected**: Same behavior as clicking next page button
3. Use arrow up key to navigate to previous page
4. **Expected**: Same behavior as clicking previous page button

### Automated Test Strategy
Due to the complexity of mocking PDF.js and scroll behavior, automated tests would require:
1. Mocking react-pdf components
2. Mocking scrollIntoView and DOM elements
3. Testing state changes and function calls

For now, manual testing is more effective for this specific scrolling behavior.

### Prevention
This regression test document should be executed before any releases that modify:
- PDFViewerModal component
- Page navigation functionality
- Scroll behavior in the PDF viewer