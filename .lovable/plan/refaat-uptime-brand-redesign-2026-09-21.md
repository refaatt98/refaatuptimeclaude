# Refaat Uptime brand redesign

## What will change
- Apply the supplied Refaat Uptime logo and warm terracotta palette across the dashboard, controls, cards, charts, statuses, and notifications.
- Add editable dashboard title and subtitle with click-to-edit, autosave, and persistent settings.
- Redesign project cards for stronger hierarchy, clearer uptime/status details, branded sparklines, and warm hover treatment.
- Rebuild the project detail panel with a wider readable layout, copyable account/reference values, masked notes, larger history, and clearer check logs.
- Update the favicon from the supplied transparent logo and replace the header mark with the full brand.
- Preserve existing monitoring, resume, filtering, status animations, and account-token behavior.

## Data and behavior
- Add a `dashboard_settings` table holding `title` and `subtitle` values.
- Public dashboard reads and updates these two presentation settings through validated server actions.
- Keep project notes editable while masking their display by default in the detail view.

## Validation
- Confirm desktop and mobile layouts in the running preview.
- Verify title/subtitle editing, project-panel controls, copy buttons, notes masking, and existing resume flow UI.
- Check the latest build and runtime diagnostics, including the existing card animation crash.
