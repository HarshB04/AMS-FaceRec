---
created: 2026-05-12T18:09:19.844Z
title: Implement Notifications Feature
area: ui
files:
  - src/app/components/layout/DashboardSidebar.tsx
---

## Problem

The Notifications feature in the app is currently non-functional. The bell icon / notifications UI exists in the dashboard but does not display real data, send alerts, or respond to system events (e.g. student marked absent, new attendance session started).

## Solution

- Decide on notification trigger events (e.g. attendance marked, face enrollment completed, session started)
- Create a `notifications` table in Supabase with RLS policies
- Add a Supabase Realtime subscription or Edge Function trigger to insert notifications on relevant events
- Build a `NotificationBell` component that polls or subscribes to unread notifications for the current user
- Display notifications in a dropdown from the sidebar/topbar
- Mark notifications as read on click
