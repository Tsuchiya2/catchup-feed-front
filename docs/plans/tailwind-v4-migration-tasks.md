# Tailwind CSS v4 Migration - Task Plan

**Feature**: Migrate from JavaScript-based Tailwind v3 configuration to CSS-first v4 configuration
**Design Document**: `docs/designs/tailwind-v4-migration.md`
**Status**: Planning Phase
**Created**: 2025-12-09

---

## Table of Contents

1. [Overview](#overview)
2. [Task Categories](#task-categories)
3. [Detailed Task Breakdown](#detailed-task-breakdown)
4. [Task Dependencies](#task-dependencies)
5. [Risk Mitigation](#risk-mitigation)
6. [Success Criteria](#success-criteria)

---

## Overview

### Context

The project is currently using Tailwind CSS v4 (`tailwindcss@4.0.0` and `@tailwindcss/postcss@4.1.17`) but maintains a legacy JavaScript configuration file (`tailwind.config.ts`) from the v3 era. This migration will:

1. Move all theme configuration from `tailwind.config.ts` to CSS using `@theme` directive
2. Remove the JavaScript config file entirely
3. Maintain 100% backward compatibility with existing components
4. Leverage v4's CSS-first architecture for better performance

### Migration Scope

**Files to Modify:**
- `src/app/globals.css` - Add `@theme` configuration
- `tailwind.config.ts` - To be removed

**Components Affected:**
- All shadcn/ui components (Button, Select, Switch, Label, Card)
- 9 pages using `container` utility
- All custom cyber-themed components with glow effects

**Lines of Configuration:**
- Current: 122 lines in JavaScript
- After: ~60 lines in CSS (more concise)

---

## Task Categories

### 1. Preparation Tasks (P)
Backup, research, and setup tasks before migration

### 2. Migration Tasks (M)
Core configuration changes to CSS

### 3. Container Handling Tasks (C)
Special handling for container utilities

### 4. Testing Tasks (T)
Verification of functionality and visual regression testing

### 5. Cleanup Tasks (CL)
Remove old files and verify final state

### 6. Documentation Tasks (D)
Update documentation and create migration notes

---

## Detailed Task Breakdown

### Phase 1: Preparation

#### P1: Backup Current Configuration
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: None

**Description:**
Create a backup of the current configuration files before making any changes to enable quick rollback if needed.

**Tasks:**
1. Create a backup branch: `git checkout -b backup/pre-tailwind-v4-migration`
2. Commit current state with tag: `git tag pre-tailwind-v4-migration`
3. Return to feature branch: `git checkout feature/cyber-glow-status-indicators`

**Acceptance Criteria:**
- ✅ Backup branch exists
- ✅ Git tag created for easy rollback reference
- ✅ Current working branch is the feature branch

**Risk Level**: None

---

#### P2: Verify Development Environment
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: None

**Description:**
Ensure the development environment is set up correctly and the current configuration is working before migration.

**Tasks:**
1. Clear Next.js cache: `rm -rf .next`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Verify the app loads correctly at `http://localhost:3000`
5. Check for any console errors or warnings
6. Test hot reload by making a minor change

**Acceptance Criteria:**
- ✅ Development server starts without errors
- ✅ All pages load correctly
- ✅ No console errors in browser DevTools
- ✅ Hot reload works correctly

**Risk Level**: None

---

#### P3: Analyze Container Usage
**Complexity**: Low
**Duration**: 10 minutes
**Dependencies**: None

**Description:**
Document all usages of the `container` utility class to determine if custom CSS implementation is needed.

**Tasks:**
1. Search codebase for `container` class usage
2. Document all files using container:
   - `src/components/layout/Header.tsx` (2 usages)
   - `src/app/page.tsx` (1 usage)
   - `src/app/(protected)/dashboard/page.tsx` (1 usage)
   - `src/app/(protected)/articles/page.tsx` (2 usages)
   - `src/app/(protected)/sources/page.tsx` (2 usages)
   - `src/app/(protected)/articles/[id]/page.tsx` (1 usage)
3. Review current container configuration in `tailwind.config.ts`
4. Decide on migration strategy (custom CSS utility vs. inline styles)

**Acceptance Criteria:**
- ✅ All container usages documented
- ✅ Container configuration requirements understood
- ✅ Migration strategy decided

**Risk Level**: Low
**Note**: 9 files use container utility, requiring custom CSS implementation

---

### Phase 2: CSS Migration

#### M1: Add @theme Configuration Block to globals.css
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: P1, P2, P3

**Description:**
Add the complete `@theme` configuration to `globals.css` while preserving existing CSS variables and utilities.

**Tasks:**
1. Open `src/app/globals.css`
2. After line 1 (`@import 'tailwindcss';`), add new line
3. Add `@theme inline` block for shadcn/ui colors (lines 2-50)
4. Add `@theme` block for direct color values (lines 51-70)
5. Verify syntax is correct (no typos or missing semicolons)

**Configuration to Add:**

```css
@import 'tailwindcss';

/* Theme configuration using @theme inline for CSS variable references */
@theme inline {
  /* shadcn/ui colors - referencing CSS variables */
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  /* Glow colors */
  --color-glow-primary: hsl(var(--glow-primary));
  --color-glow-secondary: hsl(var(--glow-secondary));
}

/* Direct color values (no CSS variable reference needed) */
@theme {
  /* Cyber theme colors */
  --color-cyber-blue: #00d4ff;
  --color-cyber-blue-dark: #0099cc;
  --color-cyber-blue-light: #66e5ff;
  --color-cyber-glow: #a0ffff;
  --color-cyber-glow-base: #00ffff;

  /* Font family */
  --font-sans: var(--font-inter), system-ui, sans-serif;

  /* Border radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  /* ... existing code ... */
}
```

**Acceptance Criteria:**
- ✅ `@theme inline` block added with all shadcn/ui colors
- ✅ `@theme` block added with cyber colors, fonts, and border radius
- ✅ No syntax errors in CSS file
- ✅ Existing `@layer base` and `@layer utilities` sections unchanged
- ✅ File saves without linting errors

**Risk Level**: Low
**Rollback**: Remove added lines from globals.css

---

#### M2: Add Container Utility to @layer utilities
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: M1

**Description:**
Since Tailwind v4 doesn't support container configuration in CSS yet, we need to create a custom container utility class in `@layer utilities` to maintain compatibility with existing components.

**Tasks:**
1. Open `src/app/globals.css`
2. Navigate to the `@layer utilities` section (currently line 69)
3. Add custom container utility at the top of utilities layer
4. Preserve all existing utilities (glow effects, animations, etc.)

**Configuration to Add:**

```css
@layer utilities {
  /* Container utility - Tailwind v4 doesn't support container config in CSS yet */
  .container {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  @media (min-width: 1536px) {
    .container {
      max-width: 1400px;
    }
  }

  /* ... existing glow effects and animations below ... */
}
```

**Acceptance Criteria:**
- ✅ Container utility added to utilities layer
- ✅ Container maintains center alignment with auto margins
- ✅ Container has 2rem padding on sides
- ✅ Container has max-width of 1400px on 2xl screens (1536px+)
- ✅ All existing utilities preserved below container definition
- ✅ No syntax errors

**Risk Level**: Low
**Rollback**: Remove container utility from globals.css

---

#### M3: Verify CSS Configuration Loads Correctly
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: M1, M2

**Description:**
Test that the new CSS configuration loads without errors before removing the JavaScript config.

**Tasks:**
1. Save `globals.css` file
2. Check terminal for Next.js compilation errors
3. Wait for hot reload to complete
4. Check browser DevTools console for errors
5. Check browser DevTools Network tab for CSS loading

**Acceptance Criteria:**
- ✅ No compilation errors in terminal
- ✅ Hot reload completes successfully
- ✅ No console errors in browser
- ✅ CSS file loads in Network tab
- ✅ Page renders (even if styles are duplicated/conflicting)

**Risk Level**: Low
**Rollback**: Revert changes to globals.css

---

### Phase 3: JavaScript Config Removal

#### M4: Remove tailwind.config.ts
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: M3

**Description:**
Delete the JavaScript configuration file now that all configuration is in CSS.

**Tasks:**
1. Verify `globals.css` has all necessary configuration from M1 and M2
2. Delete `tailwind.config.ts` file: `rm tailwind.config.ts`
3. Check that TypeScript types for Config are no longer needed

**Acceptance Criteria:**
- ✅ `tailwind.config.ts` file deleted
- ✅ No file exists at project root for Tailwind config

**Risk Level**: Low
**Rollback**: Restore file from Git: `git checkout tailwind.config.ts`

---

#### M5: Verify Application Builds After Config Removal
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: M4

**Description:**
Ensure the application compiles and hot reload works after removing the JavaScript config.

**Tasks:**
1. Wait for Next.js hot reload to complete
2. Check terminal for any compilation errors
3. Refresh browser and check for console errors
4. Verify pages still render

**Acceptance Criteria:**
- ✅ No compilation errors in terminal
- ✅ Hot reload completes successfully
- ✅ No console errors in browser
- ✅ Pages render correctly (visual verification in next phase)

**Risk Level**: Medium
**Rollback**: Restore tailwind.config.ts and remove @theme from globals.css

---

### Phase 4: Testing

#### T1: Test Color Utilities in Browser DevTools
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: M5

**Description:**
Verify that all color utilities are generated correctly and CSS variables are accessible.

**Tasks:**
1. Open browser DevTools (F12)
2. Navigate to Elements tab
3. Inspect `:root` element and verify CSS variables exist:
   - `--color-primary`, `--color-background`, etc.
   - `--color-cyber-blue`, `--color-cyber-blue-dark`, etc.
   - `--font-sans`, `--radius-lg`, etc.
4. Inspect `.dark` element and verify dark mode variables exist
5. Inspect any element with color classes (e.g., `bg-primary`)
6. Verify the computed styles use correct HSL values
7. Test opacity modifiers work: `bg-primary/50` should show 50% opacity
8. Check Console tab for any warnings or errors

**Acceptance Criteria:**
- ✅ All CSS variables available on `:root`
- ✅ All dark mode variables available on `.dark`
- ✅ Color utility classes generated (`bg-primary`, `text-cyber-blue`, etc.)
- ✅ Opacity modifiers work correctly
- ✅ No console errors or warnings

**Risk Level**: Low
**Tools**: Browser DevTools (Elements, Console)

---

#### T2: Visual Regression Testing - Light Mode
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: T1

**Description:**
Verify all pages look identical in light mode compared to before migration.

**Tasks:**
1. Ensure light mode is active (no `.dark` class on root)
2. Navigate through all pages and verify visual appearance:
   - Home page (`/`)
   - Dashboard page (`/dashboard`)
   - Articles page (`/articles`)
   - Article detail page (`/articles/[id]`)
   - Sources page (`/sources`)
3. Check for visual regressions:
   - Background colors correct
   - Text colors correct
   - Border colors correct
   - Card appearances correct
   - Button styles correct
   - Input styles correct
4. Verify container utility works:
   - Header navigation is centered with proper padding
   - Page content containers are centered
   - Max-width constraint applies on large screens
5. Take screenshots for documentation

**Acceptance Criteria:**
- ✅ All pages render identically to pre-migration
- ✅ No color differences detected
- ✅ Container utility works as expected (centered, padded, max-width)
- ✅ All components render correctly
- ✅ No layout breaks

**Risk Level**: Medium
**Tools**: Browser, visual comparison

---

#### T3: Visual Regression Testing - Dark Mode
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: T2

**Description:**
Verify all pages look identical in dark mode with cyber theme.

**Tasks:**
1. Enable dark mode (add `.dark` class to root, or use theme toggle)
2. Navigate through all pages and verify visual appearance:
   - Home page (`/`)
   - Dashboard page (`/dashboard`)
   - Articles page (`/articles`)
   - Article detail page (`/articles/[id]`)
   - Sources page (`/sources`)
3. Check for visual regressions:
   - Dark background colors correct (`hsl(220 50% 4%)`)
   - Cyan/tech colors correct
   - Glow effects render correctly
   - Card backgrounds correct
   - Text contrast is good
4. Verify cyber theme elements:
   - Glow effects on interactive elements
   - Cyber blue accent colors (`#00d4ff`)
   - Border glows
   - Hover effects
5. Take screenshots for documentation

**Acceptance Criteria:**
- ✅ All pages render identically to pre-migration
- ✅ Cyber theme colors correct (`#00d4ff` primary)
- ✅ Dark backgrounds correct
- ✅ Glow effects work correctly
- ✅ No visual regressions

**Risk Level**: Medium
**Tools**: Browser, theme toggle, visual comparison

---

#### T4: Component Functionality Testing
**Complexity**: High
**Duration**: 20 minutes
**Dependencies**: T2, T3

**Description:**
Test all interactive components to ensure functionality is preserved.

**Tasks:**

**1. Button Components:**
- Test all button variants (default, outline, ghost, link)
- Verify hover effects work
- Verify active states work
- Test different sizes

**2. Form Components:**
- Test Select component (open dropdown, select option)
- Test Switch component (toggle on/off)
- Test Label component (check association with inputs)
- Verify form validation styling

**3. Navigation Components:**
- Test Header navigation links
- Test mobile menu (if applicable)
- Verify active link highlighting

**4. Card Components:**
- Test card hover effects
- Verify border glows
- Check card-hover-glow utility

**5. Interactive Elements:**
- Test all clickable elements
- Verify cursor changes on hover
- Check focus states (keyboard navigation)

**Acceptance Criteria:**
- ✅ All buttons work correctly
- ✅ Form components function properly
- ✅ Navigation works correctly
- ✅ Card interactions work
- ✅ Focus states visible
- ✅ No broken interactions

**Risk Level**: Medium
**Tools**: Browser, keyboard navigation, mouse interactions

---

#### T5: Animation and Effects Testing
**Complexity**: Medium
**Duration**: 15 minutes
**Dependencies**: T4

**Description:**
Verify all custom animations and glow effects work correctly.

**Tasks:**

**1. Glow Effects:**
- Test `glow-sm` utility
- Test `glow-md` utility
- Test `glow-lg` utility
- Test `text-glow` and `text-glow-sm`
- Test `border-glow` utility

**2. Animations:**
- Test `glow-pulse` animation (should pulse every 2 seconds)
- Test accordion animations (if any accordions exist)
- Test `float` animation (if used)
- Test shimmer effect (if used)

**3. Custom Backgrounds:**
- Test `bg-cyber-gradient`
- Test `bg-cyber-radial`
- Verify gradient colors match design

**4. Hover Effects:**
- Test `card-hover-glow` class
- Test button hover effects
- Test link hover effects

**Acceptance Criteria:**
- ✅ All glow effects render correctly
- ✅ Glow pulse animation works
- ✅ All animations smooth and correct timing
- ✅ Custom background gradients correct
- ✅ Hover effects work

**Risk Level**: Low
**Tools**: Browser, visual inspection, animation timing

---

#### T6: Build Testing
**Complexity**: Low
**Duration**: 10 minutes
**Dependencies**: T1, T2, T3, T4, T5

**Description:**
Verify the application builds successfully for production.

**Tasks:**
1. Stop development server
2. Clear Next.js cache: `rm -rf .next`
3. Run production build: `npm run build`
4. Check terminal output for errors or warnings
5. Verify build completes successfully
6. Check CSS output size (should be similar to before)
7. Start production server: `npm start`
8. Test production build in browser
9. Check for console errors
10. Stop production server

**Acceptance Criteria:**
- ✅ Build completes without errors
- ✅ No warnings about missing utilities
- ✅ CSS bundle size is similar to pre-migration
- ✅ Production site works correctly
- ✅ No console errors in production mode

**Risk Level**: Medium
**Tools**: npm, terminal

---

#### T7: Lint and Format Check
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: T6

**Description:**
Verify code quality and formatting are correct.

**Tasks:**
1. Run ESLint: `npm run lint`
2. Check for any linting errors
3. Run Prettier check: `npm run format:check`
4. If format errors exist, run: `npm run format`
5. Verify `globals.css` is properly formatted

**Acceptance Criteria:**
- ✅ No ESLint errors
- ✅ No Prettier formatting errors
- ✅ All files properly formatted

**Risk Level**: None
**Tools**: ESLint, Prettier

---

#### T8: Hot Reload Testing
**Complexity**: Low
**Duration**: 10 minutes
**Dependencies**: T7

**Description:**
Verify that hot reload and theme changes work quickly with the new CSS-first configuration.

**Tasks:**
1. Start development server: `npm run dev`
2. Open browser to any page
3. Make a minor CSS change in `globals.css`:
   - Change a CSS variable value (e.g., `--glow-primary`)
4. Observe hot reload speed and correctness
5. Verify change applies immediately without full page reload
6. Revert the test change
7. Test theme toggle (light to dark mode)
8. Verify instant theme switching
9. Check DevTools Performance tab for CSS update speed

**Acceptance Criteria:**
- ✅ Hot reload works correctly
- ✅ CSS changes apply without full page reload
- ✅ Theme switching is instant
- ✅ No flickering or flash of unstyled content
- ✅ Performance is good (should be faster than v3)

**Risk Level**: Low
**Tools**: Browser, DevTools Performance tab

---

### Phase 5: Cleanup

#### CL1: Verify No References to tailwind.config.ts
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: T8

**Description:**
Search the codebase to ensure no files reference or import the deleted config file.

**Tasks:**
1. Search for references: `grep -r "tailwind.config" --exclude-dir=node_modules --exclude-dir=.next`
2. Check `package.json` for any config references
3. Check `.gitignore` for config file patterns
4. Verify no import statements reference config
5. Check documentation files for outdated config references

**Acceptance Criteria:**
- ✅ No code references to `tailwind.config.ts`
- ✅ No import statements for config
- ✅ No documentation references to JavaScript config

**Risk Level**: None
**Tools**: grep, code search

---

#### CL2: Clean Build Cache
**Complexity**: Low
**Duration**: 2 minutes
**Dependencies**: CL1

**Description:**
Clean all build caches to ensure a fresh state.

**Tasks:**
1. Stop development server
2. Remove Next.js cache: `rm -rf .next`
3. Remove node_modules cache (optional): `rm -rf node_modules/.cache`
4. Restart development server: `npm run dev`
5. Verify clean build works

**Acceptance Criteria:**
- ✅ All caches cleared
- ✅ Clean build completes successfully
- ✅ Application works correctly after cache clear

**Risk Level**: None

---

#### CL3: Final Visual Verification
**Complexity**: Low
**Duration**: 10 minutes
**Dependencies**: CL2

**Description:**
Perform a final comprehensive visual check of all pages in both light and dark modes.

**Tasks:**
1. Check all pages in light mode
2. Check all pages in dark mode
3. Test theme toggling multiple times
4. Verify no regressions introduced during cleanup
5. Check for any console warnings or errors
6. Take final screenshots for documentation

**Acceptance Criteria:**
- ✅ All pages look correct in light mode
- ✅ All pages look correct in dark mode
- ✅ Theme switching works perfectly
- ✅ No console errors or warnings
- ✅ Final screenshots captured

**Risk Level**: Low

---

### Phase 6: Documentation

#### D1: Update Project Documentation
**Complexity**: Low
**Duration**: 10 minutes
**Dependencies**: CL3

**Description:**
Update any project documentation that references Tailwind configuration.

**Tasks:**
1. Check if README.md mentions Tailwind configuration
2. Update any configuration sections to reference CSS-first approach
3. Add note about Tailwind v4 migration
4. Update any developer setup guides
5. Document the custom container utility if needed

**Acceptance Criteria:**
- ✅ README.md updated (if necessary)
- ✅ Configuration documentation updated
- ✅ Migration noted in project docs
- ✅ Custom utilities documented

**Risk Level**: None

---

#### D2: Create Migration Summary Document
**Complexity**: Low
**Duration**: 15 minutes
**Dependencies**: D1

**Description:**
Create a summary document of the migration for future reference.

**Tasks:**
1. Create `docs/migrations/tailwind-v4-migration-summary.md`
2. Document what was changed:
   - Removed `tailwind.config.ts`
   - Added `@theme` blocks to `globals.css`
   - Added custom container utility
3. Document testing results
4. Include before/after comparisons
5. Note any lessons learned
6. Include rollback instructions
7. Add screenshots showing successful migration

**Document Structure:**
```markdown
# Tailwind CSS v4 Migration Summary

**Date**: 2025-12-09
**Status**: Completed

## Changes Made
- Removed `tailwind.config.ts` (122 lines)
- Added `@theme` configuration to `globals.css` (~60 lines)
- Created custom container utility

## Testing Results
- All visual regression tests passed
- All component functionality tests passed
- Build tests passed
- Performance improved (faster hot reload)

## Files Modified
- `src/app/globals.css`
- `tailwind.config.ts` (deleted)

## Rollback Instructions
If rollback is needed:
1. `git checkout pre-tailwind-v4-migration tailwind.config.ts`
2. Remove `@theme` blocks from `globals.css`
3. Remove custom container utility
4. `npm run build`

## Performance Impact
- Build time: Similar or faster
- Hot reload: Noticeably faster
- CSS bundle size: Similar (~XX KB)

## Lessons Learned
- [Add any lessons learned during migration]

## Screenshots
[Include before/after screenshots]
```

**Acceptance Criteria:**
- ✅ Migration summary document created
- ✅ All changes documented
- ✅ Testing results documented
- ✅ Rollback instructions clear
- ✅ Screenshots included

**Risk Level**: None

---

#### D3: Git Commit and Documentation
**Complexity**: Low
**Duration**: 5 minutes
**Dependencies**: D2

**Description:**
Create a clean Git commit for the migration with proper documentation.

**Tasks:**
1. Stage all changes: `git add .`
2. Review staged changes: `git status`
3. Verify only expected files are staged:
   - Modified: `src/app/globals.css`
   - Deleted: `tailwind.config.ts`
   - New: `docs/migrations/tailwind-v4-migration-summary.md`
4. Create commit with descriptive message
5. Push to remote branch

**Commit Message:**
```
feat: migrate to Tailwind CSS v4 CSS-first configuration

- Remove tailwind.config.ts (122 lines)
- Add @theme configuration to globals.css
- Add custom container utility for backward compatibility
- Maintain 100% visual and functional compatibility
- All tests passed (visual, functional, build)

BREAKING CHANGE: Tailwind configuration now in CSS instead of JavaScript

Migration details: docs/migrations/tailwind-v4-migration-summary.md
Design document: docs/designs/tailwind-v4-migration.md
```

**Acceptance Criteria:**
- ✅ All changes staged correctly
- ✅ No unintended files in commit
- ✅ Commit message is clear and descriptive
- ✅ Changes pushed to remote branch

**Risk Level**: None

---

## Task Dependencies

### Dependency Graph

```
Preparation Phase:
P1 (Backup) ─┐
P2 (Verify)  ├─→ P3 (Analyze Container)
             │
Migration Phase:
P3 ──────────┴─→ M1 (Add @theme) ──→ M2 (Add Container) ──→ M3 (Verify CSS)
                                                               │
                                                               ↓
                                                      M4 (Remove Config) ──→ M5 (Verify Build)
                                                                               │
Testing Phase:                                                                │
M5 ───────────→ T1 (DevTools) ──→ T2 (Light Mode) ──→ T3 (Dark Mode) ───────┤
                                         │                │                   │
                                         └────────────────┴──→ T4 (Components)│
                                                               │              │
                                                               ↓              │
                                                         T5 (Animations) ─────┤
                                                                              │
T1,T2,T3,T4,T5 ────────────────────────────────────────────→ T6 (Build) ────┤
                                                                              │
T6 ───────────────────────────────────────────────────────→ T7 (Lint) ───────┤
                                                                              │
T7 ───────────────────────────────────────────────────────→ T8 (Hot Reload) ─┤
                                                                              │
Cleanup Phase:                                                                │
T8 ────────────→ CL1 (Verify) ──→ CL2 (Clean) ──→ CL3 (Final Visual) ────────┤
                                                                              │
Documentation Phase:                                                          │
CL3 ───────────→ D1 (Update Docs) ──→ D2 (Migration Summary) ──→ D3 (Commit) ┘
```

### Critical Path

The critical path (longest sequence of dependent tasks) is:
```
P1 → P2 → P3 → M1 → M2 → M3 → M4 → M5 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → CL1 → CL2 → CL3 → D1 → D2 → D3
```

**Total Estimated Time**: ~3 hours (with buffer)

### Parallel Tasks

Some tasks can be run in parallel:
- **T2 and T3** (Light/Dark mode) can inform T4 if visual issues detected
- **Documentation tasks** (D1, D2) can be started during cleanup phase

---

## Risk Mitigation

### Risk Assessment by Task

| Task ID | Risk Level | Mitigation Strategy |
|---------|-----------|---------------------|
| P1-P3   | None/Low  | Simple prep tasks, easy rollback |
| M1-M2   | Low       | Backup exists, syntax validation |
| M3      | Low       | Test before removing old config |
| M4      | Low       | Easy to restore from Git |
| M5      | Medium    | Verify build before proceeding |
| T1-T5   | Medium    | Thorough testing catches issues |
| T6      | Medium    | Production build test critical |
| T7-T8   | Low       | Code quality checks |
| CL1-CL3 | Low       | Final verification |
| D1-D3   | None      | Documentation only |

### Rollback Procedures

#### Quick Rollback (< 5 minutes)
If issues discovered during testing:
```bash
# Restore config file
git checkout pre-tailwind-v4-migration tailwind.config.ts

# Revert globals.css changes
git checkout pre-tailwind-v4-migration src/app/globals.css

# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Partial Rollback (Keep some changes)
If only specific issues:
1. Keep `@theme` configuration in `globals.css`
2. Restore `tailwind.config.ts`
3. Both configurations will coexist temporarily
4. Debug specific issue
5. Remove problematic configuration

### Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| Colors not applying | Incorrect CSS variable syntax | Check `hsl(var(--variable))` format |
| Container not working | Custom utility missing | Verify container utility in @layer utilities |
| Build fails | Syntax error in CSS | Run CSS validation, check console |
| Dark mode broken | CSS variable scope issue | Check `.dark` class variables |
| Animations not working | Keyframes in wrong location | Ensure keyframes in @layer utilities |
| Fonts not loading | Font family syntax error | Check --font-sans format |

### Testing Checkpoints

After each major phase, verify:
1. ✅ Application compiles without errors
2. ✅ No console errors in browser
3. ✅ Pages render correctly
4. ✅ Theme switching works

If any checkpoint fails:
1. Stop proceeding to next phase
2. Debug current issue
3. Consider partial rollback
4. Document issue for future reference

---

## Success Criteria

### Migration is Successful When:

#### Functional Requirements
- ✅ All pages render identically in light and dark modes
- ✅ All color utilities work (`bg-primary`, `text-cyber-blue`, etc.)
- ✅ All animations and glow effects function correctly
- ✅ Container utility works on all 9 pages using it
- ✅ Dark mode toggle switches themes correctly
- ✅ All form components work (Select, Switch, Label)
- ✅ All button variants work correctly
- ✅ Navigation works correctly

#### Build Requirements
- ✅ Production build completes without errors
- ✅ Development server starts without errors
- ✅ Hot reload works smoothly
- ✅ No console errors or warnings
- ✅ ESLint and Prettier pass
- ✅ CSS bundle size similar or smaller

#### Code Quality Requirements
- ✅ No references to `tailwind.config.ts` in codebase
- ✅ CSS syntax is valid and properly formatted
- ✅ Code follows project conventions
- ✅ Git commit is clean and well-documented

#### Documentation Requirements
- ✅ Migration summary document created
- ✅ Project documentation updated
- ✅ Rollback instructions documented
- ✅ Screenshots captured for reference

#### Performance Requirements
- ✅ Build time similar or faster than before
- ✅ Hot reload faster than before (expected with v4)
- ✅ Theme switching is instant
- ✅ No performance regressions detected

### Definition of Done

The migration is **complete** when:
1. All tasks (P1-D3) are completed
2. All acceptance criteria met
3. All success criteria met
4. Code committed and pushed
5. No known issues or regressions
6. Documentation updated
7. Team can proceed with confidence

---

## Appendix

### Estimated Time Breakdown

| Phase | Tasks | Est. Time | Complexity |
|-------|-------|-----------|-----------|
| Preparation | P1-P3 | 20 min | Low |
| Migration | M1-M5 | 45 min | Low-Medium |
| Testing | T1-T8 | 90 min | Medium-High |
| Cleanup | CL1-CL3 | 17 min | Low |
| Documentation | D1-D3 | 30 min | Low |
| **Total** | **22 tasks** | **~3.5 hours** | **Medium** |

### Task Checklist

**Preparation**
- [ ] P1: Backup current configuration
- [ ] P2: Verify development environment
- [ ] P3: Analyze container usage

**Migration**
- [ ] M1: Add @theme configuration to globals.css
- [ ] M2: Add container utility to @layer utilities
- [ ] M3: Verify CSS configuration loads
- [ ] M4: Remove tailwind.config.ts
- [ ] M5: Verify application builds

**Testing**
- [ ] T1: Test color utilities in DevTools
- [ ] T2: Visual regression testing - light mode
- [ ] T3: Visual regression testing - dark mode
- [ ] T4: Component functionality testing
- [ ] T5: Animation and effects testing
- [ ] T6: Build testing
- [ ] T7: Lint and format check
- [ ] T8: Hot reload testing

**Cleanup**
- [ ] CL1: Verify no references to tailwind.config.ts
- [ ] CL2: Clean build cache
- [ ] CL3: Final visual verification

**Documentation**
- [ ] D1: Update project documentation
- [ ] D2: Create migration summary document
- [ ] D3: Git commit and documentation

---

**Last Updated**: 2025-12-09
**Author**: EDAF Planner Agent
**Status**: Ready for Evaluation
**Next Step**: Launch planner evaluators for validation
