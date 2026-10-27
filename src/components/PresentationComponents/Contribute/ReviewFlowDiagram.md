# Review Flow Implementation Checklist

## EditorialPlatformTable.tsx Changes

### ✅ New State Variables
- [ ] Add `savedContributionState` - stores last saved version
- [ ] Add `isActiveReview` - tracks active review session
- [ ] Update `mode` state to properly track ReadOnly vs Edit

### ✅ New Handler Functions
- [ ] `handleStartReview()` - initiates review mode
  - Saves current state as baseline
  - Sets isActiveReview = true
  - Sets mode = ReviewMode.Edit

- [ ] `handleReviewSubmit(review)` - processes review submission
  - Adds review to reviews array
  - Updates savedContributionState
  - Exits review mode
  - Shows success message

- [ ] `handleReviewCancel()` - cancels active review
  - Reverts to savedContributionState
  - Clears review changes
  - Exits review mode
  - Shows cancellation message

- [ ] `handleBackClick()` - handles back navigation
  - Clears all state variables
  - Navigates to table view
  - Ensures clean state for next load

- [ ] `handleRowClick(data)` - handles row selection
  - Sets active contribution
  - Initializes savedContributionState
  - Sets read-only mode
  - Creates original entity

### ✅ Update Existing Functions
- [ ] Update row click handler to use new `handleRowClick`
- [ ] Pass new handlers to ContributionForm props:
  - `onStartReview={handleStartReview}`
  - `onCommitReview={handleReviewSubmit}`
  - `onAbandonReview={handleReviewCancel}`

### ✅ UI Updates
- [ ] Update mode indicator badge to show correct colors:
  - Blue for read-only mode
  - Orange for review/edit mode
- [ ] Update badge text to show correct mode
- [ ] Use new `handleBackClick` for Back button

---

## ContributionForm.tsx Changes

### ✅ New State Variables
- [ ] Add `preReviewState` - stores state before review started
- [ ] Update `isReviewMode` to sync with mode prop
- [ ] Add `reviewChanges` - stores current review changes
- [ ] Add `originalChanges` - stores original contribution changes

### ✅ Update Mode Detection
- [ ] Fix `isReadOnlyMode` calculation:
  ```typescript
  const isReadOnlyMode = mode === ReviewMode.ReadOnly && !isReviewMode;
  ```

### ✅ Update Handler Functions
- [ ] `handleStartReview()` - enhanced to save pre-review state
  - Store preReviewState
  - Initialize empty reviewChanges
  - Create new review object

- [ ] `handleCommitReview()` - enhanced to properly merge changes
  - Merge reviewChanges with originalChanges
  - Update parent component
  - Clear review state
  - Show success message

- [ ] `handleAbandonReview()` - enhanced to revert state
  - Restore preReviewState
  - Clear reviewChanges
  - Call parent onAbandonReview
  - Show cancellation message

- [ ] `onChangesUpdate()` - enhanced for change isolation
  - In review mode: update reviewChanges only
  - In normal mode: update changes directly
  - Proper change stacking

### ✅ Update useMemo/useEffect Hooks
- [ ] Update `stackedEntity` computation to apply changes in order:
  1. Original contribution changes
  2. All committed review changes
  3. Current review changes (if in review mode)

- [ ] Add useEffect to sync `isReviewMode` with `mode` prop

- [ ] Update effect to initialize originalChanges from changeSet

### ✅ UI Updates
- [ ] Update card title to show correct mode
- [ ] Show correct action buttons based on mode:
  - Read-only: "Start Review" button
  - Review mode: "Cancel Review" + "Submit Review" buttons
- [ ] Update button states (disable submit when no changes)
- [ ] Update labels (Review Comments vs Contribution Message)
- [ ] Display change counts correctly per mode

---

## EntityForm.tsx Changes

### ✅ Props Update
- [ ] Ensure `readOnly` prop is properly passed and respected
- [ ] Verify all input components respect readOnly state

---

## Backend Integration Tasks

### ✅ API Endpoints Needed
- [ ] `GET /contributions/:id` - fetch contribution with reviews
- [ ] `POST /contributions/:id/reviews` - submit new review
- [ ] `PATCH /contributions/:id/status` - update status (already exists)

### ✅ Data Structure
- [ ] Ensure backend returns reviews array with each contribution
- [ ] Verify review structure includes:
  - changeSet with changes array
  - stackOrder for proper ordering
  - timestamp and author info

---

## Testing Checklist

### ✅ Functional Tests
- [ ] Test: Click row → Opens in read-only mode
- [ ] Test: Start Review → Switches to edit mode
- [ ] Test: Make changes → Changes appear in summary
- [ ] Test: Submit Review → Success message, returns to read-only
- [ ] Test: Cancel Review → Changes discarded, returns to read-only
- [ ] Test: Back button after cancel → Shows original on re-open
- [ ] Test: Back button after submit → Shows updated data on re-open
- [ ] Test: Multiple reviews → Changes stack correctly
- [ ] Test: Status changes → Updates properly

### ✅ Edge Cases
- [ ] Test: Start review without making changes → Submit disabled
- [ ] Test: Network failure during submit → Proper error handling
- [ ] Test: Rapid mode switching → State remains consistent
- [ ] Test: Browser refresh during review → Proper state recovery
- [ ] Test: Published contributions → Review disabled

### ✅ UI/UX Tests
- [ ] Test: Mode indicator shows correct state
- [ ] Test: Buttons enable/disable correctly
- [ ] Test: Confirmation modals appear for destructive actions
- [ ] Test: Success/error messages display properly
- [ ] Test: Form fields disable in read-only mode
- [ ] Test: Change counters update correctly

---

## Performance Checks
- [ ] Verify useMemo prevents unnecessary recalculations
- [ ] Check grid refresh performance after status update
- [ ] Test with large number of changes
- [ ] Test with multiple reviews stacked

---

## Documentation Tasks
- [ ] Document the review flow for team
- [ ] Add inline code comments for complex logic
- [ ] Update user documentation/help text
- [ ] Create troubleshooting guide for common issues

---

## Deployment Checklist
- [ ] Code review completed
- [ ] All tests passing
- [ ] Backend endpoints deployed and tested
- [ ] Frontend changes deployed
- [ ] Database migrations run (if needed)
- [ ] Monitor for errors in production
- [ ] Gather user feedback

---

## Quick Start Implementation Order

1. **Phase 1: State Management** (EditorialPlatformTable)
   - Add new state variables
   - Implement handler functions
   - Update row click and back button

2. **Phase 2: Form Updates** (ContributionForm)
   - Add state variables
   - Update handlers
   - Fix mode detection

3. **Phase 3: Change Stacking** (Both files)
   - Implement change isolation
   - Compute stacked entity
   - Test change merging

4. **Phase 4: UI Polish** (Both files)
   - Update indicators
   - Add confirmations
   - Improve messages

5. **Phase 5: Integration** (Backend)
   - Connect API endpoints
   - Test data flow
   - Handle errors

6. **Phase 6: Testing & Deployment**
   - Run all tests
   - Fix bugs
   - Deploy to production