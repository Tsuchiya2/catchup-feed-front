# Task Plan: Source Active/Inactive Toggle

## Document Information

**Feature**: Source Active/Inactive Toggle
**Design Document**: `docs/designs/source-active-toggle.md`
**Created**: 2025-12-07
**Status**: Ready for Implementation

---

## Overview

This task plan outlines the implementation strategy for adding an interactive toggle control to the Sources page, allowing ADMIN users to enable/disable sources while maintaining read-only display for non-admin users.

**Total Estimated Effort**: 4-5 hours
**Number of Tasks**: 12 tasks
**Worker Assignments**:
- Frontend Worker: 6 tasks (T001-T006)
- Test Worker: 6 tasks (T007-T012)

---

## Prerequisites

### Environment Requirements
- [ ] Node.js and npm installed
- [ ] Development server can run successfully
- [ ] Backend API is accessible and running
- [ ] Admin and non-admin user accounts available for testing

### Backend Requirements
- [ ] `PUT /sources/{id}` endpoint is implemented and functional
- [ ] JWT tokens include 'role' field in payload
- [ ] Backend enforces admin-only authorization for source updates
- [ ] Backend returns updated Source object on successful update

### Technical Requirements
- [ ] React Query (@tanstack/react-query) is installed
- [ ] lucide-react is installed
- [ ] Next.js 15 is configured
- [ ] TypeScript is configured

---

## Task Breakdown

### Phase 0: Critical Prerequisites

#### T001: Export decodeJWTPayload Function
**Priority**: CRITICAL - MUST BE COMPLETED FIRST
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: S (5 minutes)
**Dependencies**: None

**Description**:
Export the `decodeJWTPayload` function from `/src/lib/auth/token.ts` to make it available for role extraction. This is a prerequisite for all other tasks.

**Implementation Details**:
- Locate the `decodeJWTPayload` function in `/src/lib/auth/token.ts`
- Change function declaration from `function decodeJWTPayload` to `export function decodeJWTPayload`
- Verify no breaking changes to existing code

**Deliverables**:
- Modified `/src/lib/auth/token.ts` with exported function
- Function signature: `export function decodeJWTPayload(token: string): Record<string, unknown> | null`

**Acceptance Criteria**:
- [ ] `decodeJWTPayload` is exported from `/src/lib/auth/token.ts`
- [ ] Function can be imported in other files
- [ ] Existing code that uses this function still works
- [ ] No TypeScript compilation errors

**Testing**:
- Import the function in a test file to verify export
- Run existing test suite to ensure no regressions

---

### Phase 1: Core Implementation

#### T002: Create Role Utilities Module
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: S (15 minutes)
**Dependencies**: T001

**Description**:
Create a new utilities module for extracting user roles from JWT tokens and providing role-checking helper functions.

**Implementation Details**:
- Create new file: `/src/lib/auth/role.ts`
- Import `getAuthToken` and `decodeJWTPayload` from `/src/lib/auth/token.ts`
- Define `UserRole` type: `'admin' | 'user' | null`
- Implement `getUserRole()` function to extract role from JWT token
- Implement `isAdmin()` helper function
- Handle edge cases: missing token, invalid token, missing role field
- Default to 'user' role if role field is missing

**Deliverables**:
- New file: `/src/lib/auth/role.ts`
- Exported types: `UserRole`
- Exported functions: `getUserRole()`, `isAdmin()`

**Acceptance Criteria**:
- [ ] File created at `/src/lib/auth/role.ts`
- [ ] `getUserRole()` returns 'admin' when token has role='admin'
- [ ] `getUserRole()` returns 'user' when token has role='user'
- [ ] `getUserRole()` returns 'user' when token has no role field (fallback)
- [ ] `getUserRole()` returns null when token is invalid or missing
- [ ] `isAdmin()` returns true only when role is 'admin'
- [ ] No TypeScript errors

**Testing**:
- Unit tests will be added in T007

---

#### T003: Install shadcn/ui Switch Component
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: S (5 minutes)
**Dependencies**: None

**Description**:
Install the shadcn/ui Switch component which will be used for the toggle control in the ActiveToggle component.

**Implementation Details**:
- Run command: `npx shadcn@latest add switch`
- Verify installation creates `/src/components/ui/switch.tsx`
- Review generated code for any customization needs

**Deliverables**:
- New file: `/src/components/ui/switch.tsx`
- Updated dependencies in package.json (if any)

**Acceptance Criteria**:
- [ ] Switch component installed successfully
- [ ] File exists at `/src/components/ui/switch.tsx`
- [ ] Component can be imported without errors
- [ ] No installation errors or warnings

**Testing**:
- Import Switch component in a test file to verify installation

---

#### T004: Create ActiveToggle Component
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: M (45 minutes)
**Dependencies**: T003

**Description**:
Create the ActiveToggle component that provides an interactive toggle control for admin users to enable/disable sources with optimistic updates and error handling.

**Implementation Details**:
- Create new file: `/src/components/sources/ActiveToggle.tsx`
- Use `React.memo` for component memoization (following SourceCard pattern)
- Import Switch component from `/src/components/ui/switch.tsx`
- Import Loader2 icon from lucide-react
- Implement props interface: `ActiveToggleProps`
- Manage local state: `isToggling`, `error`, `currentActive`
- Implement `handleToggle` function with error handling
- Auto-dismiss error messages after 5 seconds
- Add proper ARIA labels and accessibility attributes
- Implement error message rendering with role="alert"
- Create `getErrorMessage` helper function for error mapping

**Component Interface**:
```typescript
interface ActiveToggleProps {
  sourceId: number;
  sourceName: string;
  initialActive: boolean;
  onToggle: (sourceId: number, newActive: boolean) => Promise<void>;
  className?: string;
}
```

**Deliverables**:
- New file: `/src/components/sources/ActiveToggle.tsx`
- Memoized functional component with TypeScript
- Error handling and loading states
- Accessibility features (ARIA labels, keyboard support)

**Acceptance Criteria**:
- [ ] Component created at `/src/components/sources/ActiveToggle.tsx`
- [ ] Component uses `React.memo` for optimization
- [ ] Renders Switch component with correct state
- [ ] Shows loading indicator during API calls
- [ ] Displays error messages below toggle
- [ ] Error messages auto-dismiss after 5 seconds
- [ ] Proper ARIA labels for accessibility
- [ ] Keyboard accessible (Space/Enter keys work)
- [ ] TypeScript types are correct
- [ ] Follows existing code style

**Testing**:
- Unit tests will be added in T008

---

#### T005: Add updateSourceActive API Function
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: S (15 minutes)
**Dependencies**: None

**Description**:
Add a new API function to update source active status by calling the backend `PUT /sources/{id}` endpoint.

**Implementation Details**:
- Modify file: `/src/lib/api/endpoints/sources.ts`
- Import `apiClient` (should already be imported)
- Add `updateSourceActive` function
- Use `apiClient.put<SourceResponse>()` method
- Include JSDoc documentation
- Handle request body formatting: `{ active: boolean }`
- Return Promise resolving to SourceResponse

**Function Signature**:
```typescript
export async function updateSourceActive(
  id: number,
  active: boolean
): Promise<SourceResponse>
```

**Deliverables**:
- Modified `/src/lib/api/endpoints/sources.ts`
- New exported function: `updateSourceActive`
- JSDoc documentation

**Acceptance Criteria**:
- [ ] Function added to `/src/lib/api/endpoints/sources.ts`
- [ ] Function signature matches design document
- [ ] Uses existing apiClient infrastructure
- [ ] Includes proper TypeScript types
- [ ] Has JSDoc documentation
- [ ] Throws ApiError on failure
- [ ] No TypeScript errors

**Testing**:
- Integration tests will be added in T010

---

#### T006: Modify SourceCard Component
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: M (30 minutes)
**Dependencies**: T002, T004

**Description**:
Update the SourceCard component to conditionally render ActiveToggle for admin users or StatusBadge for non-admin users based on user role.

**Implementation Details**:
- Modify file: `/src/components/sources/SourceCard.tsx`
- Import `ActiveToggle` component
- Import `UserRole` type from `/src/lib/auth/role`
- Add new props: `userRole` and `onUpdateActive`
- Update `SourceCardProps` interface
- Implement conditional rendering logic: if admin → ActiveToggle, else → StatusBadge
- Create `handleToggle` callback wrapper
- Manage local error state (if needed)
- Pass correct props to ActiveToggle and StatusBadge

**Updated Props Interface**:
```typescript
interface SourceCardProps {
  source: Source;
  className?: string;
  userRole: UserRole; // NEW
  onUpdateActive?: (sourceId: number, active: boolean) => Promise<void>; // NEW
}
```

**Deliverables**:
- Modified `/src/components/sources/SourceCard.tsx`
- Conditional rendering based on user role
- Updated TypeScript interfaces

**Acceptance Criteria**:
- [ ] SourceCard accepts `userRole` and `onUpdateActive` props
- [ ] Renders ActiveToggle when userRole is 'admin'
- [ ] Renders StatusBadge when userRole is not 'admin'
- [ ] Passes correct props to ActiveToggle
- [ ] Existing functionality not broken
- [ ] No TypeScript errors
- [ ] Follows existing code style

**Testing**:
- Unit tests will be added in T009

---

### Phase 2: Integration

#### T007: Update Sources Page with Role Detection
**Priority**: HIGH
**Assigned To**: frontend-worker-v1-self-adapting
**Estimated Effort**: M (45 minutes)
**Dependencies**: T005, T006

**Description**:
Update the Sources page to detect user role, implement optimistic updates, and pass the necessary props to SourceCard components.

**Implementation Details**:
- Modify file: `/src/app/(protected)/sources/page.tsx`
- Import `getUserRole` from `/src/lib/auth/role`
- Import `updateSourceActive` from `/src/lib/api/endpoints/sources`
- Import `useQueryClient`, `useMutation` from '@tanstack/react-query'
- Add state for user role using `useState`
- Implement `useEffect` to set user role on mount
- Implement mutation with optimistic updates using React Query
- Create `handleUpdateActive` function
- Pass `userRole` and `onUpdateActive` to each SourceCard
- Implement rollback on error

**State Management Pattern**:
```typescript
const mutation = useMutation({
  mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
    return updateSourceActive(id, active);
  },
  onMutate: async ({ id, active }) => {
    // Optimistic update logic
  },
  onError: (err, variables, context) => {
    // Rollback logic
  },
  onSettled: () => {
    // Refetch to ensure consistency
  },
});
```

**Deliverables**:
- Modified `/src/app/(protected)/sources/page.tsx`
- Role detection on page load
- Optimistic update implementation
- Error handling and rollback

**Acceptance Criteria**:
- [ ] Page detects user role on mount
- [ ] Role passed to all SourceCard components
- [ ] `handleUpdateActive` function implemented
- [ ] Optimistic updates work correctly
- [ ] Errors trigger rollback to previous state
- [ ] Cache invalidation after updates
- [ ] No TypeScript errors
- [ ] No runtime errors

**Testing**:
- Integration tests will be added in T011

---

### Phase 3: Testing

#### T008: Create Role Utilities Unit Tests
**Priority**: MEDIUM
**Assigned To**: test-worker-v1-self-adapting
**Estimated Effort**: S (20 minutes)
**Dependencies**: T002

**Description**:
Write comprehensive unit tests for the role utilities module to ensure correct role extraction and edge case handling.

**Implementation Details**:
- Create new file: `/src/lib/auth/role.test.ts`
- Mock `getAuthToken` and `decodeJWTPayload` functions
- Test `getUserRole()` with various scenarios
- Test `isAdmin()` helper function
- Cover all edge cases

**Test Cases**:
1. Returns 'admin' when token has role='admin'
2. Returns 'user' when token has role='user'
3. Returns 'user' when token has no role field (fallback)
4. Returns null when token is invalid
5. Returns null when token is missing
6. `isAdmin()` returns true only for admin role
7. `isAdmin()` returns false for user role
8. `isAdmin()` returns false when role is null

**Deliverables**:
- New file: `/src/lib/auth/role.test.ts`
- Minimum 8 test cases
- Mock implementations for dependencies

**Acceptance Criteria**:
- [ ] All test cases passing
- [ ] Code coverage > 90% for role.ts
- [ ] Edge cases covered
- [ ] Mocks properly implemented
- [ ] No test failures

**Testing Command**:
```bash
npm test src/lib/auth/role.test.ts
```

---

#### T009: Create ActiveToggle Unit Tests
**Priority**: MEDIUM
**Assigned To**: test-worker-v1-self-adapting
**Estimated Effort**: M (30 minutes)
**Dependencies**: T004

**Description**:
Write comprehensive unit tests for the ActiveToggle component to ensure correct rendering, interaction, error handling, and accessibility.

**Implementation Details**:
- Create new file: `/src/components/sources/ActiveToggle.test.tsx`
- Use React Testing Library
- Mock the onToggle callback
- Test component rendering in different states
- Test user interactions (click, keyboard)
- Test error handling and auto-dismiss
- Test accessibility features

**Test Cases**:
1. Renders toggle in active state when initialActive is true
2. Renders toggle in inactive state when initialActive is false
3. Calls onToggle callback when clicked
4. Shows loading indicator during API call
5. Displays error message on toggle failure
6. Error message auto-dismisses after 5 seconds
7. Toggle is disabled during loading
8. Accessible via keyboard (Space/Enter keys)
9. Has proper ARIA labels
10. Error message associated via aria-describedby

**Deliverables**:
- New file: `/src/components/sources/ActiveToggle.test.tsx`
- Minimum 10 test cases
- Mock implementations for props

**Acceptance Criteria**:
- [ ] All test cases passing
- [ ] Code coverage > 90% for ActiveToggle.tsx
- [ ] User interactions tested
- [ ] Accessibility features verified
- [ ] Error handling tested
- [ ] Loading states tested
- [ ] No test failures

**Testing Command**:
```bash
npm test src/components/sources/ActiveToggle.test.tsx
```

---

#### T010: Update SourceCard Unit Tests
**Priority**: MEDIUM
**Assigned To**: test-worker-v1-self-adapting
**Estimated Effort**: S (20 minutes)
**Dependencies**: T006

**Description**:
Update existing SourceCard tests to cover the new conditional rendering logic based on user role.

**Implementation Details**:
- Modify file: `/src/components/sources/SourceCard.test.tsx` (if exists)
- Add tests for admin vs non-admin rendering
- Mock ActiveToggle and StatusBadge components
- Test prop passing

**Test Cases**:
1. Renders StatusBadge when userRole is 'user'
2. Renders StatusBadge when userRole is null
3. Renders ActiveToggle when userRole is 'admin'
4. Passes correct props to ActiveToggle (sourceId, sourceName, initialActive, onToggle)
5. Passes correct props to StatusBadge
6. Calls onUpdateActive when toggle changes (admin)

**Deliverables**:
- Modified `/src/components/sources/SourceCard.test.tsx`
- Additional test cases for role-based rendering
- Mock components

**Acceptance Criteria**:
- [ ] All new test cases passing
- [ ] Existing tests still passing
- [ ] Code coverage maintained or improved
- [ ] Conditional rendering tested
- [ ] Prop passing verified
- [ ] No test failures

**Testing Command**:
```bash
npm test src/components/sources/SourceCard.test.tsx
```

---

#### T011: Create updateSourceActive API Tests
**Priority**: MEDIUM
**Assigned To**: test-worker-v1-self-adapting
**Estimated Effort**: S (20 minutes)
**Dependencies**: T005

**Description**:
Write tests for the `updateSourceActive` API function to ensure correct API calls and error handling.

**Implementation Details**:
- Create or modify: `/src/lib/api/endpoints/sources.test.ts`
- Mock apiClient.put method
- Test successful API calls
- Test error scenarios
- Verify request payload format

**Test Cases**:
1. Calls PUT /sources/{id} with correct endpoint
2. Sends correct request body: { active: true/false }
3. Returns SourceResponse on success
4. Throws ApiError on 403 Forbidden
5. Throws ApiError on 404 Not Found
6. Throws ApiError on 500 Server Error
7. Includes Authorization header (via apiClient)

**Deliverables**:
- New or modified test file for sources API
- Minimum 7 test cases
- Mock apiClient implementation

**Acceptance Criteria**:
- [ ] All test cases passing
- [ ] API call parameters verified
- [ ] Error handling tested
- [ ] Request/response format validated
- [ ] No test failures

**Testing Command**:
```bash
npm test src/lib/api/endpoints/sources.test.ts
```

---

#### T012: Create Sources Page Integration Tests
**Priority**: MEDIUM
**Assigned To**: test-worker-v1-self-adapting
**Estimated Effort**: M (40 minutes)
**Dependencies**: T007

**Description**:
Write integration tests for the Sources page to ensure role detection, optimistic updates, and error handling work correctly end-to-end.

**Implementation Details**:
- Create or modify: `/src/app/(protected)/sources/page.test.tsx`
- Mock useSources hook
- Mock getUserRole function
- Mock updateSourceActive API function
- Test admin and non-admin user flows
- Test optimistic updates and rollback

**Test Cases**:
1. Admin user sees ActiveToggle on all source cards
2. Non-admin user sees StatusBadge on all source cards
3. Clicking toggle calls updateSourceActive API
4. Successful toggle updates source in cache
5. Successful toggle invalidates query cache
6. Failed toggle shows error message
7. Failed toggle reverts to previous state
8. Multiple rapid toggles handled correctly

**Deliverables**:
- New or modified test file for Sources page
- Minimum 8 test cases
- Mock implementations for hooks and API

**Acceptance Criteria**:
- [ ] All test cases passing
- [ ] Role-based rendering tested
- [ ] Optimistic updates verified
- [ ] Error rollback tested
- [ ] Cache invalidation verified
- [ ] No test failures

**Testing Command**:
```bash
npm test src/app/(protected)/sources/page.test.tsx
```

---

## Implementation Order

### Sequential Workflow

**Phase 0: Critical Prerequisites** (5 minutes)
1. T001 - Export decodeJWTPayload Function ⚠️ **CRITICAL FIRST STEP**

**Phase 1: Core Implementation** (2 hours)
2. T002 - Create Role Utilities Module (depends on T001)
3. T003 - Install shadcn/ui Switch Component (parallel with T002)
4. T004 - Create ActiveToggle Component (depends on T003)
5. T005 - Add updateSourceActive API Function (parallel with T004)
6. T006 - Modify SourceCard Component (depends on T002, T004)

**Phase 2: Integration** (45 minutes)
7. T007 - Update Sources Page with Role Detection (depends on T005, T006)

**Phase 3: Testing** (2-2.5 hours)
8. T008 - Create Role Utilities Unit Tests (parallel with T009-T012)
9. T009 - Create ActiveToggle Unit Tests (parallel with T008, T010-T012)
10. T010 - Update SourceCard Unit Tests (parallel with T008-T009, T011-T012)
11. T011 - Create updateSourceActive API Tests (parallel with T008-T010, T012)
12. T012 - Create Sources Page Integration Tests (parallel with T008-T011)

**Note**: Tasks in the same phase can be executed in parallel except where dependencies are specified.

---

## Testing Strategy

### Unit Testing
- **Tool**: Jest with React Testing Library
- **Coverage Target**: > 90% for new code
- **Focus Areas**:
  - Component rendering in different states
  - User interactions (click, keyboard)
  - Error handling and auto-dismiss
  - Role detection logic
  - API function calls and error mapping

### Integration Testing
- **Tool**: Jest with React Testing Library
- **Coverage Target**: > 80% for integration scenarios
- **Focus Areas**:
  - End-to-end user flows (admin and non-admin)
  - Optimistic updates and rollback
  - Cache invalidation
  - Error propagation

### Manual Testing Checklist
**Admin User Flow**:
- [ ] Login as admin user
- [ ] Navigate to /sources page
- [ ] Verify all sources show toggle controls
- [ ] Toggle active source to inactive
- [ ] Verify optimistic UI update
- [ ] Verify loading indicator appears
- [ ] Verify toggle stays in new position
- [ ] Refresh page and verify state persisted
- [ ] Toggle inactive source to active
- [ ] Verify success flow

**Non-Admin User Flow**:
- [ ] Login as regular user
- [ ] Navigate to /sources page
- [ ] Verify all sources show status badges
- [ ] Verify no toggle controls visible
- [ ] Verify no interaction possible

**Error Handling Flow**:
- [ ] Login as admin user
- [ ] Disconnect network
- [ ] Attempt to toggle source
- [ ] Verify error message appears
- [ ] Verify toggle reverts to previous state
- [ ] Reconnect network
- [ ] Verify toggle works correctly

**Accessibility Testing**:
- [ ] Navigate to toggle using Tab key
- [ ] Activate toggle using Space key
- [ ] Activate toggle using Enter key
- [ ] Verify screen reader announces state changes
- [ ] Verify error messages are announced
- [ ] Verify color contrast meets WCAG 2.1 AA

---

## Risk Assessment

### High Risk Areas

#### Risk 1: JWT Token Structure
**Description**: JWT token may not include 'role' field
**Impact**: HIGH - Feature will not work
**Probability**: MEDIUM
**Mitigation**:
- Verify token structure with backend team before starting
- Implement fallback behavior (default to 'user' role)
- Add logging to detect missing role field
**Contingency**:
- If role field is missing, add temporary role detection based on other token fields
- Coordinate with backend to add role field to JWT

#### Risk 2: decodeJWTPayload Function Not Exported
**Description**: T001 may reveal additional dependencies or issues
**Impact**: MEDIUM - Blocks all other tasks
**Probability**: LOW
**Mitigation**:
- Complete T001 immediately as first task
- Verify export works correctly before proceeding
**Contingency**:
- If export causes breaking changes, copy function to new location
- Refactor existing code to use exported version

#### Risk 3: Optimistic Update Race Conditions
**Description**: Multiple rapid toggles may cause state inconsistencies
**Impact**: MEDIUM - Poor UX
**Probability**: MEDIUM
**Mitigation**:
- Disable toggle during API call
- Use React Query's built-in mutation queue
- Implement proper loading states
**Contingency**:
- Add debouncing to toggle interactions
- Disable optimistic updates (fall back to pessimistic updates)

### Medium Risk Areas

#### Risk 4: shadcn/ui Switch Installation
**Description**: Switch component may not install correctly
**Impact**: MEDIUM - Blocks T004
**Probability**: LOW
**Mitigation**:
- Verify shadcn/ui is properly configured in project
- Test installation in clean environment
**Contingency**:
- Build custom toggle component without shadcn
- Use alternative UI library switch component

#### Risk 5: Test Coverage Gaps
**Description**: Edge cases may not be covered in tests
**Impact**: LOW - Bugs may slip to production
**Probability**: MEDIUM
**Mitigation**:
- Follow comprehensive test case lists in tasks
- Review test coverage report
- Add tests during code review
**Contingency**:
- Allocate additional time for test improvements
- Conduct thorough manual testing

### Low Risk Areas

#### Risk 6: Browser Compatibility
**Description**: Toggle may not work in older browsers
**Impact**: LOW - Next.js 15 already drops old browsers
**Probability**: LOW
**Mitigation**:
- Use standard web APIs
- Test in supported browsers (Chrome, Firefox, Safari, Edge)
**Contingency**:
- Add polyfills if needed
- Document browser requirements

---

## Success Criteria

### Functional Requirements
- [ ] Admin users can toggle source active/inactive status
- [ ] Non-admin users see read-only status badge
- [ ] Optimistic UI updates work correctly
- [ ] Toggle reverts on API failure
- [ ] Error messages displayed for failures
- [ ] Loading states shown during API calls
- [ ] Role detection works for all user types

### Non-Functional Requirements
- [ ] Toggle response feels instant (< 100ms optimistic update)
- [ ] All unit tests passing (> 90% coverage for new code)
- [ ] All integration tests passing (> 80% coverage)
- [ ] No TypeScript compilation errors
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] No performance degradation on Sources page
- [ ] Works in all supported browsers

### Code Quality
- [ ] Follows existing code style and patterns
- [ ] Uses React.memo for component optimization
- [ ] Proper TypeScript types for all functions
- [ ] JSDoc documentation for public APIs
- [ ] Error handling for all failure scenarios
- [ ] No console warnings or errors

---

## Deployment Checklist

### Pre-Deployment Verification
- [ ] T001 completed - decodeJWTPayload exported
- [ ] All tasks T001-T012 completed
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed for all flows
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Backend API confirmed working (PUT /sources/{id})
- [ ] JWT token includes 'role' field (verified with backend)
- [ ] Admin test account available
- [ ] Non-admin test account available

### Deployment Steps
1. Run full test suite: `npm test`
2. Build production bundle: `npm run build`
3. Verify no build errors or warnings
4. Deploy to staging environment
5. Test with real admin account on staging
6. Test with real non-admin account on staging
7. Verify API calls work correctly
8. Deploy to production
9. Monitor error logs for 24 hours
10. Verify no unexpected errors

### Rollback Plan
- **Trigger**: Critical bugs or errors discovered in production
- **Action**: Revert to previous deployment version
- **Safety**: Frontend-only change, no database migrations
- **Recovery Time**: < 5 minutes (simple revert)

### Post-Deployment Monitoring
- [ ] Monitor error logs for 24 hours
- [ ] Track toggle operation success rate
- [ ] Check for 403/500 errors in API calls
- [ ] Verify no performance degradation
- [ ] Collect user feedback

---

## Worker Assignment Summary

### Frontend Worker Tasks
| Task ID | Title | Effort | Files |
|---------|-------|--------|-------|
| T001 | Export decodeJWTPayload Function | S | `/src/lib/auth/token.ts` |
| T002 | Create Role Utilities Module | S | `/src/lib/auth/role.ts` |
| T003 | Install shadcn/ui Switch Component | S | `/src/components/ui/switch.tsx` |
| T004 | Create ActiveToggle Component | M | `/src/components/sources/ActiveToggle.tsx` |
| T005 | Add updateSourceActive API Function | S | `/src/lib/api/endpoints/sources.ts` |
| T006 | Modify SourceCard Component | M | `/src/components/sources/SourceCard.tsx` |
| T007 | Update Sources Page with Role Detection | M | `/src/app/(protected)/sources/page.tsx` |

### Test Worker Tasks
| Task ID | Title | Effort | Files |
|---------|-------|--------|-------|
| T008 | Create Role Utilities Unit Tests | S | `/src/lib/auth/role.test.ts` |
| T009 | Create ActiveToggle Unit Tests | M | `/src/components/sources/ActiveToggle.test.tsx` |
| T010 | Update SourceCard Unit Tests | S | `/src/components/sources/SourceCard.test.tsx` |
| T011 | Create updateSourceActive API Tests | S | `/src/lib/api/endpoints/sources.test.ts` |
| T012 | Create Sources Page Integration Tests | M | `/src/app/(protected)/sources/page.test.tsx` |

---

## Dependencies Graph

```
T001 (Export decodeJWTPayload)
  └─→ T002 (Role Utilities)
       └─→ T006 (Modify SourceCard)
            └─→ T007 (Update Sources Page)

T003 (Install Switch)
  └─→ T004 (ActiveToggle)
       └─→ T006 (Modify SourceCard)
            └─→ T007 (Update Sources Page)

T005 (API Function)
  └─→ T007 (Update Sources Page)

Testing (can run in parallel after implementation):
- T008 (Role Tests) - depends on T002
- T009 (ActiveToggle Tests) - depends on T004
- T010 (SourceCard Tests) - depends on T006
- T011 (API Tests) - depends on T005
- T012 (Page Tests) - depends on T007
```

---

## Notes for Implementation

### Code Style Guidelines
1. **Follow existing patterns**: Review `SourceCard.tsx` and `ArticleCard.tsx` for component structure
2. **Use React.memo**: Memoize components for performance optimization
3. **TypeScript strict mode**: Ensure all types are properly defined
4. **Error handling**: Use try-catch blocks and provide user-friendly error messages
5. **Accessibility first**: Include ARIA labels and keyboard support from the start

### Common Pitfalls to Avoid
1. **Don't skip T001**: This is critical and must be completed first
2. **Don't trust frontend authorization**: Backend must enforce permissions
3. **Don't forget error rollback**: Optimistic updates must revert on failure
4. **Don't ignore loading states**: Users need feedback during API calls
5. **Don't skip accessibility**: Keyboard navigation and screen readers are required

### Testing Best Practices
1. **Test user flows, not implementation**: Focus on behavior, not internal state
2. **Mock external dependencies**: API calls, hooks, and context providers
3. **Test edge cases**: Invalid tokens, network errors, missing data
4. **Verify accessibility**: Test keyboard navigation and ARIA attributes
5. **Keep tests focused**: One test should verify one behavior

---

## Appendix: File Structure

### New Files to Create
```
/src/lib/auth/role.ts
/src/lib/auth/role.test.ts
/src/components/ui/switch.tsx (via shadcn)
/src/components/sources/ActiveToggle.tsx
/src/components/sources/ActiveToggle.test.tsx
```

### Files to Modify
```
/src/lib/auth/token.ts (export decodeJWTPayload)
/src/lib/api/endpoints/sources.ts (add updateSourceActive)
/src/lib/api/endpoints/sources.test.ts (add tests)
/src/components/sources/SourceCard.tsx (conditional rendering)
/src/components/sources/SourceCard.test.tsx (update tests)
/src/app/(protected)/sources/page.tsx (role detection + optimistic updates)
/src/app/(protected)/sources/page.test.tsx (add tests)
```

---

## Appendix: Quick Reference

### Key TypeScript Interfaces

```typescript
// User Role Type
export type UserRole = 'admin' | 'user' | null;

// ActiveToggle Props
interface ActiveToggleProps {
  sourceId: number;
  sourceName: string;
  initialActive: boolean;
  onToggle: (sourceId: number, newActive: boolean) => Promise<void>;
  className?: string;
}

// SourceCard Props (Updated)
interface SourceCardProps {
  source: Source;
  className?: string;
  userRole: UserRole; // NEW
  onUpdateActive?: (sourceId: number, active: boolean) => Promise<void>; // NEW
}
```

### Key Functions

```typescript
// Role Utilities
export function getUserRole(): UserRole;
export function isAdmin(): boolean;

// API Function
export async function updateSourceActive(
  id: number,
  active: boolean
): Promise<SourceResponse>;
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test src/lib/auth/role.test.ts

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

**End of Task Plan**
