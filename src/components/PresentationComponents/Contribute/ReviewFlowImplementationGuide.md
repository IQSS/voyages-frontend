# Review Flow Implementation Guide

## Overview
This implementation provides a complete review workflow system with proper state management for contributions and reviews.

## Key Features Implemented

### 1. **State Management in EditorialPlatformTable**

#### New State Variables
- `savedContributionState`: Stores the last saved/submitted version of the contribution
- `isActiveReview`: Tracks if user is currently in an active review session

#### State Flow
```
Initial Load → savedContributionState = original data
Start Review → Keep savedContributionState as baseline
Cancel Review → Revert to savedContributionState
Submit Review → Update savedContributionState with new changes
```

### 2. **Review Lifecycle**

#### **Start Review Flow**
```typescript
handleStartReview() {
  1. Save current state as baseline (savedContributionState)
  2. Set isActiveReview = true
  3. Set mode = ReviewMode.Edit
  4. Create new empty review object
}
```

#### **Submit Review Flow**
```typescript
handleReviewSubmit(review) {
  1. Add review to reviews array
  2. Merge review changes into contribution
  3. Update savedContributionState with merged data
  4. Set isActiveReview = false
  5. Set mode = ReviewMode.ReadOnly
  6. Show success message
}
```

#### **Cancel Review Flow**
```typescript
handleReviewCancel() {
  1. Revert active state to savedContributionState
  2. Discard all review changes
  3. Set isActiveReview = false
  4. Set mode = ReviewMode.ReadOnly
  5. Show cancellation message
}
```

### 3. **Back Button Behavior**

#### **handleBackClick() Logic**
```typescript
handleBackClick() {
  // Always resets to clean state
  1. Clear all active state variables
  2. Reset savedContributionState
  3. Reset isActiveReview and mode
  4. Navigate back to table
}
```

#### **Scenarios**

**Case 1: Cancel then Back**
```
User clicks row → Load original data → savedContributionState = original
Start Review → savedContributionState unchanged
Cancel Review → Revert to savedContributionState (original)
Click Back → Clear all state
Click row again → Load original data again ✓
```

**Case 2: Submit then Back**
```
User clicks row → Load original data → savedContributionState = original
Start Review → savedContributionState unchanged
Submit Review → savedContributionState = original + review changes
Click Back → Clear all state
Click row again → Load from backend (includes submitted review) ✓
```

### 4. **Row Click Handling**

```typescript
handleRowClick(data) {
  1. Set active = data
  2. Set savedContributionState = data (baseline)
  3. Set mode = ReviewMode.ReadOnly
  4. Set isActiveReview = false
  5. Navigate to detail view
}
```

### 5. **ContributionForm State Management**

#### New State Variables
- `preReviewState`: Stores the changeset state before review started
- `isReviewMode`: Tracks if currently in review mode
- `reviewChanges`: Stores changes made during current review
- `originalChanges`: Stores the original contribution changes

#### Change Stacking Logic
```typescript
onChangesUpdate(newChange) {
  if (isReviewMode) {
    // Stack changes on top of original
    reviewChanges = addToChangeSet(reviewChanges, newChange)
    onChange({ ...changeSet, changes: reviewChanges })
  } else {
    // Normal mode - update directly
    onChange({ ...changeSet, changes: addToChangeSet(changes, newChange) })
  }
}
```

### 6. **Stacked Entity Computation**

The `stackedEntity` applies changes in order:
```typescript
1. Start with base entity
2. Apply original contribution changes
3. Apply each committed review's changes (in order)
4. Apply current review changes (if in review mode)
```

This ensures that when viewing or editing in review mode, you see the cumulative effect of all previous changes plus your current edits.

## Usage Flow

### Happy Path: Review and Submit
1. User clicks row → Opens in read-only mode
2. User clicks "Start Review" → Switches to edit mode
3. User makes changes → Changes tracked separately as review
4. User clicks "Submit Review" → Changes saved and stacked
5. User clicks "Back" → Returns to table
6. User clicks same row → Shows original + submitted review ✓

### Cancel Path: Review and Cancel
1. User clicks row → Opens in read-only mode
2. User clicks "Start Review" → Switches to edit mode
3. User makes changes → Changes tracked as review
4. User clicks "Cancel Review" → Changes discarded
5. User clicks "Back" → Returns to table
6. User clicks same row → Shows original data (no review) ✓

## Key Implementation Details

### Preventing Data Loss
- `savedContributionState` always holds the last known good state
- Cancel operations revert to `savedContributionState`
- Submit operations update `savedContributionState`

### Read-Only Mode Detection
```typescript
const isReadOnlyMode = mode === ReviewMode.ReadOnly && !isReviewMode;
```
This ensures form fields are disabled only when truly in read-only mode, not during active review.

### Change Isolation
- **Original changes**: Always preserved in `originalChanges` state
- **Review changes**: Tracked separately in `reviewChanges` state
- **Display changes**: Computed based on current mode

### Modal Confirmations
All destructive actions (cancel, reset, submit) require user confirmation to prevent accidental data loss.

## Integration Points

### Backend Integration Required

#### 1. Fetch Contribution by ID
```typescript
// In EditorialPlatformTable useEffect
const response = await fetchContributionsDataByID(id);
const contribution = response.data;

// Should include:
// - Original contribution data
// - All committed reviews
// - Current status
```

#### 2. Submit Review
```typescript
// In handleReviewSubmit
await submitReview(contributionId, review);

// Payload should include:
// - Review changes
// - Review comments
// - Timestamp
// - Stack order
```

#### 3. Update Contribution Status
```typescript
// Already implemented
await updateContributionStatus(contributionId, newStatus, comments);
```

### Frontend State Synchronization

#### After Backend Operations
```typescript
// After successful review submission:
1. Update local state with new review
2. Refresh contribution data if needed
3. Update savedContributionState

// After status change:
1. Update local contribution status
2. Refresh grid to show updated status
```

## Testing Scenarios

### Scenario 1: Basic Review Flow
```
✓ Click row → See read-only view
✓ Click "Start Review" → Enable editing
✓ Make changes → See changes in summary
✓ Click "Submit Review" → Confirm dialog appears
✓ Confirm → Success message, return to read-only
✓ Click "Back" → Return to table
✓ Click row again → See original + submitted changes
```

### Scenario 2: Cancel During Review
```
✓ Click row → See read-only view
✓ Click "Start Review" → Enable editing
✓ Make changes → See changes in summary
✓ Click "Cancel Review" → Confirm dialog appears
✓ Confirm → Changes discarded, return to read-only
✓ Data shows original state (no review changes)
```

### Scenario 3: Multiple Reviews
```
✓ Submit first review → Changes saved
✓ Start second review → See original + first review
✓ Make more changes → See all changes stacked
✓ Submit second review → Both reviews saved
✓ View shows: original + review1 + review2
```

### Scenario 4: Back Button Edge Cases
```
✓ Start review, make changes, go back → Changes lost (expected)
✓ Submit review, go back → Changes saved
✓ Cancel review, go back → No changes saved
✓ Re-open contribution → Shows correct state
```

## UI Indicators

### Mode Indicators
- **Read-only Mode**: Blue badge with eye icon
- **Review Mode**: Orange badge with edit icon
- Button text changes: "Start Review" ↔ "Cancel/Submit Review"

### Change Counters
- Shows number of changes in current session
- Review mode: Shows only new review changes
- Read-only mode: Shows all committed changes

### Status Display
- Contribution status shown in header
- Updates in real-time after editorial decisions

## Error Handling

### Network Failures
```typescript
try {
  await submitReview(contributionId, review);
} catch (error) {
  message.error('Failed to submit review');
  // Keep user in review mode with changes intact
  // Allow retry
}
```

### State Recovery
```typescript
// If state becomes inconsistent:
1. savedContributionState acts as fallback
2. Can reset to last known good state
3. User can abandon review to recover
```

### Validation
```typescript
// Before submitting review:
1. Check reviewChanges.length > 0
2. Validate form fields
3. Confirm user intent via modal
```

## Performance Considerations

### Change Computation
- Changes computed with `useMemo` to avoid unnecessary recalculations
- Only recomputes when dependencies change

### Entity Stacking
- Stacked entity computed lazily
- Cached until reviews or mode changes

### Grid Updates
```typescript
// Efficient grid refresh after status change:
gridRef.current?.api.refreshCells();
// Only refreshes affected cells, not entire grid
```

## Future Enhancements

### Potential Improvements
1. **Undo/Redo**: Track change history for better editing experience
2. **Auto-save**: Periodically save review progress to prevent data loss
3. **Conflict Detection**: Detect if contribution changed while reviewing
4. **Review Comments**: Add inline comments for specific changes
5. **Review History**: Show timeline of all reviews with authors
6. **Diff View**: Visual diff between original and current state
7. **Batch Review**: Review multiple contributions at once

### Accessibility
- Keyboard navigation for review actions
- Screen reader announcements for mode changes
- Clear visual focus indicators

## Summary

This implementation provides:
- ✅ Proper state isolation between original and review changes
- ✅ Correct back button behavior for both cancel and submit cases
- ✅ Change stacking that accumulates reviews over time
- ✅ Clear user feedback via modals and messages
- ✅ Data integrity through saved state management
- ✅ Intuitive UI with mode indicators

The key insight is maintaining `savedContributionState` as the source of truth for the "last good state" and using it as the recovery point for all cancel operations.