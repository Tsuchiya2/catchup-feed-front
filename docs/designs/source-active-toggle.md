# Design Document: Source Active/Inactive Toggle

## Executive Summary

**Document Status**: Version 1.0 - Initial Design

**Feature Overview**: Add an interactive toggle control to the Sources page that allows ADMIN users to enable/disable sources, while other users see a read-only status badge.

**Key Design Decisions**:
- ✅ Reuse existing StatusBadge component for non-admin users
- ✅ Create new ActiveToggle component for admin users
- ✅ Extract user role from JWT token payload using existing token utilities
- ✅ Use optimistic updates with rollback on API failure
- ✅ Implement comprehensive error handling and user feedback
- ✅ Leverage existing API client infrastructure

**Estimated Implementation Time**: ~4-5 hours

---

## 1. Overview

### 1.1 Purpose
Enable ADMIN users to toggle source active/inactive status directly from the Sources page through an interactive UI control, while maintaining read-only display for non-admin users.

### 1.2 Background
The backend API already supports updating source active status via `PUT /sources/{id}` endpoint with an admin-only authorization requirement. Currently, the frontend only displays the status as a read-only badge. This feature will expose the existing backend functionality to admin users through the UI.

### 1.3 Goals
- Provide an interactive toggle control for ADMIN users to change source active status
- Display read-only status badge for non-admin users
- Implement optimistic UI updates with rollback on failure
- Show appropriate loading states during API calls
- Provide clear success/error feedback using visual indicators
- Maintain existing UI/UX consistency
- Ensure proper authorization at the frontend level

### 1.4 Non-Goals
- Modifying backend API implementation
- Creating new backend endpoints
- Adding bulk operations (multiple sources at once)
- Implementing source creation/deletion features
- Changing the visual design of the Sources page layout

---

## 2. User Stories

### 2.1 Admin User
**As an** administrator
**I want to** toggle sources on/off directly from the Sources page
**So that** I can quickly enable or disable feeds without navigating to a separate admin panel

**Acceptance Criteria**:
- I see an interactive toggle control instead of a static badge
- Clicking the toggle immediately reflects the change (optimistic update)
- If the API call fails, the toggle reverts to the previous state
- I see a loading indicator while the API request is in progress
- I receive visual feedback (success/error) after the operation completes

### 2.2 Regular User
**As a** regular authenticated user
**I want to** see the current status of sources
**So that** I know which feeds are currently active

**Acceptance Criteria**:
- I see a read-only status badge (Active/Inactive)
- I cannot interact with the status badge
- The UI clearly indicates that the status is not editable

### 2.3 Error Handling
**As an** administrator
**When** a toggle operation fails (network error, permission error, etc.)
**Then** I see a clear error message explaining what went wrong
**And** the toggle reverts to its previous state

---

## 3. Technical Architecture

### 3.1 Component Hierarchy

```
SourcesPage (src/app/(protected)/sources/page.tsx)
└── SourceCard (src/components/sources/SourceCard.tsx)
    ├── StatusBadge (src/components/sources/StatusBadge.tsx) [Non-admin users]
    └── ActiveToggle (NEW - src/components/sources/ActiveToggle.tsx) [Admin users]
```

### 3.2 Authorization Flow

```
1. Page Load
   ├── useAuth hook retrieves JWT token from localStorage
   ├── decodeJWTPayload extracts user role from token
   └── Pass user role to SourceCard components

2. SourceCard Rendering
   ├── Check user role
   ├── If role === 'admin' → Render ActiveToggle
   └── If role !== 'admin' → Render StatusBadge (read-only)

3. Toggle Interaction (Admin only)
   ├── User clicks toggle
   ├── Optimistic UI update (immediate visual feedback)
   ├── API call to PUT /sources/{id}
   ├── Success → Keep optimistic state, show success indicator
   └── Failure → Revert to previous state, show error message
```

### 3.3 State Management

**Component State (ActiveToggle)**:
- `isToggling`: Boolean indicating if API call is in progress
- `error`: Error message if operation failed
- Actual active status managed by parent component (SourceCard)

**Parent State (SourcesPage)**:
- Sources list managed by useSources hook (React Query)
- Optimistic updates handled via React Query cache manipulation

### 3.4 API Integration

**Existing Endpoint**:
- **Method**: PUT
- **Path**: `/sources/{id}`
- **Request Body**: `{ "active": boolean }`
- **Response**: Updated Source object
- **Authorization**: Requires admin role (enforced by backend)

**New API Function** (to be added):
```typescript
// src/lib/api/endpoints/sources.ts
export async function updateSourceActive(
  id: number,
  active: boolean
): Promise<SourceResponse>
```

---

## 4. UI/UX Design

### 4.1 ActiveToggle Component Design

**Visual States**:

1. **Default State** (Admin)
   - Interactive toggle control
   - Left position = Inactive (gray)
   - Right position = Active (green)
   - Smooth transition animation

2. **Loading State**
   - Toggle shows loading spinner or disabled state
   - Slightly reduced opacity to indicate operation in progress
   - Prevents further clicks during API call

3. **Success State**
   - Brief visual confirmation (optional: subtle flash or check icon)
   - Return to default state after 2 seconds

4. **Error State**
   - Toggle reverts to previous position
   - Error message displayed below toggle or as tooltip
   - Red color indication

5. **Read-only State** (Non-admin)
   - Display existing StatusBadge component
   - No hover effects or cursor changes

**Component Props**:
```typescript
interface ActiveToggleProps {
  sourceId: number;
  sourceName: string;
  initialActive: boolean;
  onToggle: (sourceId: number, newActive: boolean) => Promise<void>;
  className?: string;
}
```

### 4.2 Layout Changes

**Current SourceCard Layout**:
```
┌─────────────────────────────────────┐
│ [Icon] Source Name                  │
│        feed_url                     │
│                                     │
│ [Active Badge]    Last crawled: ... │
└─────────────────────────────────────┘
```

**New SourceCard Layout** (Admin):
```
┌─────────────────────────────────────┐
│ [Icon] Source Name                  │
│        feed_url                     │
│                                     │
│ [Active Toggle]   Last crawled: ... │
│ [Error Message]                     │
└─────────────────────────────────────┘
```

**Error Message Display**:
- Appears below the toggle when error occurs
- Small text, red color
- Auto-dismisses after 5 seconds
- Example: "Failed to update source status. Please try again."

### 4.3 Accessibility

- Toggle has proper ARIA labels: `aria-label="Toggle source active status"`
- Keyboard accessible: Space/Enter keys to toggle
- Focus indicator visible on keyboard navigation
- Screen reader announcements for state changes
- Error messages associated with toggle via `aria-describedby`

---

## 5. Security Considerations

### 5.1 Frontend Authorization

**Role Extraction**:
```typescript
// src/lib/auth/role.ts (NEW FILE)
import { getAuthToken, decodeJWTPayload } from '@/lib/auth/token';

export type UserRole = 'admin' | 'user' | null;

export function getUserRole(): UserRole {
  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeJWTPayload(token);
  if (!payload) return null;

  // Extract role from JWT payload
  // Assuming backend includes 'role' field in token
  return (payload.role as UserRole) || 'user';
}

export function isAdmin(): boolean {
  return getUserRole() === 'admin';
}
```

**Implementation Prerequisite**: Before implementing role utilities, the `decodeJWTPayload` function in `/src/lib/auth/token.ts` must be exported. Update the function declaration from:
```typescript
function decodeJWTPayload(token: string): Record<string, unknown> | null
```
to:
```typescript
export function decodeJWTPayload(token: string): Record<string, unknown> | null
```

**Important Notes**:
- Frontend role check is for UI convenience ONLY
- Backend MUST enforce authorization on PUT /sources/{id}
- Even if user manipulates frontend to show toggle, backend will reject unauthorized requests
- Frontend should gracefully handle 403 Forbidden responses

### 5.2 API Security

**Authorization Header**:
- Existing apiClient already includes JWT token in Authorization header
- Backend validates token and checks role before allowing update
- 401 Unauthorized → Token expired/invalid → Redirect to login
- 403 Forbidden → Insufficient permissions → Show error message

### 5.3 Token Validation

**Assumptions about JWT Token**:
- Token includes `role` field in payload
- Possible values: `'admin'` or `'user'`
- Token structure example:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Fallback Behavior**:
- If role is missing/undefined → Default to 'user' (non-admin)
- If token is invalid → Show read-only badge (fail-safe)

---

## 6. Error Handling

### 6.1 Error Scenarios

| Scenario | HTTP Status | Frontend Handling |
|----------|-------------|-------------------|
| Network failure | N/A | Revert toggle, show "Network error. Please check your connection." |
| Token expired | 401 | Redirect to login (handled by apiClient) |
| Insufficient permissions | 403 | Revert toggle, show "You don't have permission to perform this action." |
| Source not found | 404 | Revert toggle, show "Source not found. Please refresh the page." |
| Validation error | 400 | Revert toggle, show "Invalid request. Please try again." |
| Server error | 500 | Revert toggle, show "Server error. Please try again later." |
| Timeout | N/A | Revert toggle, show "Request timed out. Please try again." |

### 6.2 Optimistic Update Rollback

**Implementation**:
```typescript
const handleToggle = async (sourceId: number, newActive: boolean) => {
  const previousActive = source.active;

  try {
    // Optimistic update
    updateSourceInCache(sourceId, { active: newActive });

    // API call
    await updateSourceActive(sourceId, newActive);

    // Success - refetch to ensure consistency
    refetch();
  } catch (error) {
    // Rollback optimistic update
    updateSourceInCache(sourceId, { active: previousActive });

    // Show error message
    setError(getErrorMessage(error));
  }
};
```

### 6.3 Error Message Display

**Location**: Below the toggle in SourceCard
**Duration**: 5 seconds (auto-dismiss)
**Style**: Small text, red color, subtle fade-in animation
**Dismissal**: Auto-dismiss after 5s OR user clicks toggle again

---

## 7. Testing Strategy

### 7.1 Unit Tests

**ActiveToggle Component** (`src/components/sources/ActiveToggle.test.tsx`):
- [ ] Renders toggle in correct initial state (active/inactive)
- [ ] Calls onToggle callback when clicked
- [ ] Shows loading state during API call
- [ ] Displays error message on failure
- [ ] Clears error message after 5 seconds
- [ ] Accessible via keyboard (Space/Enter)
- [ ] Has proper ARIA labels and roles

**SourceCard Component** (`src/components/sources/SourceCard.test.tsx`):
- [ ] Renders StatusBadge for non-admin users
- [ ] Renders ActiveToggle for admin users
- [ ] Passes correct props to ActiveToggle
- [ ] Handles toggle callback correctly

**getUserRole Function** (`src/lib/auth/role.test.ts`):
- [ ] Returns 'admin' when token has role='admin'
- [ ] Returns 'user' when token has role='user'
- [ ] Returns 'user' when token has no role field (fallback)
- [ ] Returns null when token is invalid
- [ ] Returns null when token is missing

### 7.2 Integration Tests

**Sources Page** (`src/app/(protected)/sources/page.test.tsx`):
- [ ] Admin user sees toggles on all source cards
- [ ] Non-admin user sees status badges on all source cards
- [ ] Toggle updates source status via API
- [ ] Successful toggle refetches sources list
- [ ] Failed toggle shows error message
- [ ] Failed toggle reverts to previous state

### 7.3 E2E Tests (Manual Checklist)

**Admin User Flow**:
- [ ] Login as admin user
- [ ] Navigate to /sources page
- [ ] Verify all sources show toggle controls (not badges)
- [ ] Click toggle to deactivate active source
- [ ] Verify optimistic UI update (immediate feedback)
- [ ] Verify loading state appears briefly
- [ ] Verify success state (toggle stays in new position)
- [ ] Refresh page and verify state persisted
- [ ] Click toggle to reactivate inactive source
- [ ] Verify the same success flow

**Non-Admin User Flow**:
- [ ] Login as regular user
- [ ] Navigate to /sources page
- [ ] Verify all sources show status badges (not toggles)
- [ ] Verify no interaction possible with status badges
- [ ] Verify no toggle controls visible

**Error Handling Flow**:
- [ ] Login as admin user
- [ ] Disconnect network
- [ ] Attempt to toggle source
- [ ] Verify error message appears
- [ ] Verify toggle reverts to previous state
- [ ] Reconnect network
- [ ] Verify toggle works correctly

**Permission Error Flow** (requires backend test user):
- [ ] Create test user with admin JWT but backend denies permission
- [ ] Attempt to toggle source
- [ ] Verify 403 error is caught
- [ ] Verify appropriate error message shown
- [ ] Verify toggle reverts to previous state

---

## 8. Implementation Details

### 8.1 Files to Create

#### 8.1.1 ActiveToggle Component
**File**: `/src/components/sources/ActiveToggle.tsx`

**Responsibilities**:
- Render toggle UI control
- Handle click events
- Show loading state
- Display error messages
- Call onToggle callback

**Implementation Pattern**: Follow existing codebase pattern by using `React.memo` for component memoization, consistent with `SourceCard` and `ArticleCard` components.

**Dependencies**:
- shadcn/ui Switch component (needs to be installed)
- lucide-react icons
- React hooks (useState, useEffect)

#### 8.1.2 Role Utilities
**File**: `/src/lib/auth/role.ts`

**Responsibilities**:
- Extract user role from JWT token
- Provide helper functions: `getUserRole()`, `isAdmin()`
- Handle missing/invalid tokens gracefully

**Dependencies**:
- Existing `decodeJWTPayload` from `/src/lib/auth/token.ts` (requires export)

**Important Note**: The `decodeJWTPayload` function currently exists in `/src/lib/auth/token.ts` but is NOT exported. This function MUST be exported to make it available for role extraction.

#### 8.1.3 API Function
**File**: `/src/lib/api/endpoints/sources.ts` (MODIFY)

**Add New Function**:
```typescript
/**
 * Update source active status
 *
 * @param id - Source ID
 * @param active - New active status
 * @returns Promise resolving to updated source
 * @throws {ApiError} When the request fails
 */
export async function updateSourceActive(
  id: number,
  active: boolean
): Promise<SourceResponse> {
  const endpoint = `/sources/${id}`;
  const response = await apiClient.put<SourceResponse>(endpoint, { active });
  return response;
}
```

#### 8.1.4 Test Files
- `/src/components/sources/ActiveToggle.test.tsx`
- `/src/lib/auth/role.test.ts`
- Update existing: `/src/components/sources/SourceCard.test.tsx`

### 8.2 Files to Modify

#### 8.2.1 Token Utilities
**File**: `/src/lib/auth/token.ts` (MODIFY)

**Changes**:
1. Export the `decodeJWTPayload` function

**Required Change**:
```typescript
// Change from:
function decodeJWTPayload(token: string): Record<string, unknown> | null

// To:
export function decodeJWTPayload(token: string): Record<string, unknown> | null
```

This is a **CRITICAL** change that must be completed FIRST before any other implementation steps.

#### 8.2.2 SourceCard Component
**File**: `/src/components/sources/SourceCard.tsx`

**Changes**:
1. Add userRole prop
2. Conditionally render ActiveToggle or StatusBadge based on role
3. Implement handleToggle callback
4. Manage local error state

**New Props**:
```typescript
interface SourceCardProps {
  source: Source;
  className?: string;
  userRole: UserRole; // NEW
  onUpdateActive?: (sourceId: number, active: boolean) => Promise<void>; // NEW
}
```

#### 8.2.3 Sources Page
**File**: `/src/app/(protected)/sources/page.tsx`

**Changes**:
1. Import `getUserRole` from `/src/lib/auth/role`
2. Get user role on component mount
3. Pass userRole to each SourceCard
4. Implement handleUpdateActive function

**State Management Note**: This design introduces `useMutation` from React Query as a new pattern for handling async state updates. While this pattern is not commonly used in the current codebase, it provides:
- Built-in loading/error states
- Optimistic updates
- Automatic cache invalidation
- Better separation of concerns

**Alternative Approach**: If you prefer to maintain consistency with existing patterns (like the `LoginForm` component which uses `useState + async function`), you can simplify the implementation by using local state management instead of `useMutation`.

**Example (with useMutation)**:
```typescript
export default function SourcesPage() {
  const { sources, isLoading, error, refetch } = useSources();
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const mutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return updateSourceActive(id, active);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleUpdateActive = async (sourceId: number, active: boolean) => {
    await mutation.mutateAsync({ id: sourceId, active });
  };

  return (
    // ...
    <SourceCard
      source={source}
      userRole={userRole}
      onUpdateActive={handleUpdateActive}
    />
  );
}
```

### 8.3 Dependencies to Install

**shadcn/ui Switch Component**:
```bash
npx shadcn@latest add switch
```

This will create `/src/components/ui/switch.tsx` based on Radix UI primitives.

**Alternative**: Build custom toggle component without shadcn if switch is not available.

### 8.4 Optimistic Update Implementation

**Using React Query Cache Manipulation**:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
    return updateSourceActive(id, active);
  },
  onMutate: async ({ id, active }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['sources'] });

    // Snapshot previous value
    const previousSources = queryClient.getQueryData(['sources']);

    // Optimistically update cache
    queryClient.setQueryData(['sources'], (old: Source[]) => {
      return old.map(source =>
        source.id === id ? { ...source, active } : source
      );
    });

    // Return context with previous value
    return { previousSources };
  },
  onError: (err, variables, context) => {
    // Rollback to previous value on error
    if (context?.previousSources) {
      queryClient.setQueryData(['sources'], context.previousSources);
    }
  },
  onSettled: () => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['sources'] });
  },
});
```

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Toggle response time: < 100ms for optimistic update
- API call timeout: 30 seconds (existing apiClient default)
- No impact on page load time (role extraction is lightweight)
- Cache invalidation should not cause visible flicker

### 9.2 Accessibility (WCAG 2.1 AA)
- Keyboard navigation: Toggle accessible via Tab + Space/Enter
- Screen reader support: Proper ARIA labels and live regions
- Color contrast: Toggle colors meet 4.5:1 ratio
- Focus indicators: Visible focus ring on toggle
- Error messages: Associated with toggle via `aria-describedby`

### 9.3 Browser Compatibility
- Modern browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- No IE11 support (Next.js 15 requirement)
- Mobile browsers: iOS Safari, Chrome Android

### 9.4 Responsive Design
- Toggle size: Touch-friendly (min 44x44px tap target)
- Mobile layout: Same as desktop (toggle fits within card)
- Tablet layout: Same as desktop

---

## 10. Monitoring and Observability

### 10.1 Logging

**Success Events**:
```typescript
console.log('[SourceToggle] Source ${sourceId} updated to ${active}');
```

**Error Events**:
```typescript
console.error('[SourceToggle] Failed to update source ${sourceId}:', error);
```

### 10.2 Metrics to Track

**Post-Deployment Monitoring** (if analytics available):
- Number of toggle operations per day
- Success rate of toggle operations
- Error rate by error type (403, 500, network, etc.)
- Average response time for PUT /sources/{id}

### 10.3 User Feedback

**Optional Future Enhancement**:
- Toast notifications for success/error (instead of inline messages)
- Confirmation dialog before deactivating source (optional)
- Audit log of who changed source status and when

---

## 11. Rollout Plan

### 11.1 Development Phases

**Phase 0: Prerequisites** (0.25 hours)
- Export `decodeJWTPayload` function from `/src/lib/auth/token.ts` (CRITICAL FIRST STEP)

**Phase 1: Core Implementation** (2 hours)
- Create ActiveToggle component (using `React.memo` pattern)
- Add getUserRole utility
- Update SourceCard to conditionally render toggle
- Add updateSourceActive API function

**Phase 2: Integration** (1 hour)
- Update Sources page with role detection
- Implement optimistic updates
- Add error handling

**Phase 3: Testing** (1-1.5 hours)
- Write unit tests for ActiveToggle
- Write unit tests for role utilities
- Update SourceCard tests
- Manual E2E testing

**Phase 4: Polish** (0.5 hours)
- Accessibility review
- Visual polish (animations, colors)
- Documentation updates

### 11.2 Deployment Strategy

**Pre-Deployment Checklist**:
- [ ] `decodeJWTPayload` function exported from token.ts
- [ ] All unit tests passing
- [ ] E2E tests completed (manual)
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Backend API confirmed working (PUT /sources/{id})
- [ ] JWT token includes 'role' field (confirmed with backend team)

**Deployment Steps**:
1. Deploy frontend changes
2. Verify role detection works in production
3. Test with admin user account
4. Test with non-admin user account
5. Monitor error logs for 24 hours

**Rollback Plan**:
- If critical bugs found: Revert to previous version
- Frontend-only change, rollback is safe
- No database migrations required

---

## 12. Future Enhancements

### 12.1 Potential Improvements (Out of Scope for v1)

**Bulk Operations**:
- Select multiple sources and toggle all at once
- "Activate All" / "Deactivate All" buttons

**Confirmation Dialog**:
- Ask for confirmation before deactivating a source
- Show impact (e.g., "This will stop fetching articles from this feed")

**Toast Notifications**:
- Replace inline error messages with toast notifications
- Better UX for success feedback

**Audit Trail**:
- Show who last changed the source status and when
- Requires backend support

**Undo Feature**:
- "Undo" button to revert last change
- Temporary cache of previous state

---

## 13. Open Questions

### 13.1 Questions for Backend Team

1. **JWT Token Structure**:
   - ✅ Confirmed: Does the JWT token include a 'role' field?
   - ✅ Confirmed: Possible values are 'admin' and 'user'?

2. **API Behavior**:
   - ✅ Confirmed: PUT /sources/{id} returns updated Source object?
   - ✅ Confirmed: 403 Forbidden returned for non-admin users?

3. **Error Responses**:
   - What error message is returned for 403 Forbidden?
   - Should we show backend error message to user or use generic message?

### 13.2 Questions for Product Team

1. **User Feedback**:
   - Inline error messages OK, or prefer toast notifications?
   - Should we add confirmation dialog before deactivating?

2. **Success Feedback**:
   - Brief visual confirmation needed, or just state change enough?
   - Toast notification for success?

---

## 14. Dependencies and Assumptions

### 14.1 External Dependencies

**Backend API**:
- Endpoint: `PUT /sources/{id}` (REQUIRED)
- Authorization: Admin role enforcement (REQUIRED)
- JWT Token: Contains 'role' field (REQUIRED)

**UI Components**:
- shadcn/ui Switch component (or custom implementation)
- Existing StatusBadge component
- Existing SourceCard component

**Libraries**:
- React Query (@tanstack/react-query) - Already installed
- lucide-react - Already installed
- Next.js 15 - Already installed

### 14.2 Assumptions

1. **JWT Token Structure**:
   - Token payload includes 'role' field
   - Role values are 'admin' or 'user' (no other roles)
   - Token is stored in localStorage (via existing auth system)

2. **Backend API**:
   - PUT /sources/{id} is already implemented
   - Backend enforces authorization (rejects non-admin)
   - Endpoint returns updated Source object on success

3. **User Roles**:
   - Only two roles exist: admin and user
   - No multi-level permissions (e.g., super-admin, moderator)
   - Role cannot change without re-login

4. **UI/UX**:
   - No confirmation dialog needed for toggle (quick action)
   - Inline error messages acceptable (no toast library needed)
   - Optimistic updates preferred for better UX

---

## 15. Success Criteria

### 15.1 Functional Requirements Met
- [ ] Admin users can toggle source active/inactive status
- [ ] Non-admin users see read-only status badge
- [ ] Optimistic UI updates work correctly
- [ ] Error handling covers all scenarios
- [ ] API integration works without issues

### 15.2 Non-Functional Requirements Met
- [ ] Toggle response feels instant (< 100ms optimistic update)
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] All unit tests passing (> 90% coverage)
- [ ] No performance degradation
- [ ] Works on all supported browsers

### 15.3 User Acceptance
- [ ] Admin users can successfully toggle sources
- [ ] No confusion about which users can edit vs view
- [ ] Error messages are clear and helpful
- [ ] Loading states provide appropriate feedback

---

## Appendix A: Component Code Structure

### ActiveToggle Component Structure

```typescript
// src/components/sources/ActiveToggle.tsx

import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface ActiveToggleProps {
  sourceId: number;
  sourceName: string;
  initialActive: boolean;
  onToggle: (sourceId: number, newActive: boolean) => Promise<void>;
  className?: string;
}

/**
 * ActiveToggle Component
 *
 * Interactive toggle control for admin users to enable/disable sources.
 *
 * Memoized to prevent unnecessary re-renders, following the pattern
 * established by SourceCard and ArticleCard components.
 */
export const ActiveToggle = React.memo(function ActiveToggle({
  sourceId,
  sourceName,
  initialActive,
  onToggle,
  className,
}: ActiveToggleProps) {
  const [isToggling, setIsToggling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentActive, setCurrentActive] = React.useState(initialActive);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    setError(null);

    try {
      await onToggle(sourceId, checked);
      setCurrentActive(checked);
    } catch (err) {
      // Revert on error
      setError(getErrorMessage(err));
    } finally {
      setIsToggling(false);
    }
  };

  // Auto-dismiss error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Switch
          checked={currentActive}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label={`Toggle ${sourceName} active status`}
          aria-describedby={error ? `error-${sourceId}` : undefined}
        />
        {isToggling && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {error && (
        <p
          id={`error-${sourceId}`}
          className="mt-1 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (error.status === 404) {
      return "Source not found. Please refresh the page.";
    }
    if (error.status >= 500) {
      return "Server error. Please try again later.";
    }
  }
  if (error instanceof NetworkError) {
    return "Network error. Please check your connection.";
  }
  return "Failed to update source status. Please try again.";
}
```

---

## Appendix B: API Response Examples

### Successful Response

**Request**:
```http
PUT /sources/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "active": false
}
```

**Response** (200 OK):
```json
{
  "id": 123,
  "name": "Example Feed",
  "feed_url": "https://example.com/feed.xml",
  "active": false,
  "last_crawled_at": "2025-01-01T12:00:00Z"
}
```

### Error Responses

**403 Forbidden** (Non-admin user):
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

**404 Not Found** (Invalid source ID):
```json
{
  "error": "Not Found",
  "message": "Source with ID 123 not found",
  "statusCode": 404
}
```

**401 Unauthorized** (Invalid/expired token):
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-07 | Designer Agent | Initial design document |
| 1.1 | 2025-12-07 | Designer Agent | Consistency improvements: Added export requirement for decodeJWTPayload, React.memo pattern for ActiveToggle, terminology standardization (toggle vs switch), state management pattern clarification |

---

**End of Design Document**
