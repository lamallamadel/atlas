# Notification Center - Visual Guide

This document provides a visual description of the notification center UI and functionality.

## UI Components Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Top Toolbar                                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │Search│ │Status│ │Theme │ │Help  │ │🔔(3) │ ← Notification   │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    Bell + Badge  │
└─────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ Click opens dropdown
┌────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 🔔 Notifications                                    🔄    │ │
│ │                                                           │ │
│ ├───────────────────────────────────────────────────────────┤ │
│ │ [ All ] [ IN_APP ] [ Email ] [ SMS ] [ WhatsApp ]       │ │ ← Filters
│ ├───────────────────────────────────────────────────────────┤ │
│ │ Aujourd'hui                                              │ │ ← Date Group
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📧  New message received               🔵 Il y a 5min│ │ │
│ │ │     You have a new message...          [✉️]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📁  Dossier status changed             Il y a 2h   │ │ │
│ │ │     Status changed to APPROVED         [✉️]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ Hier                                                     │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 📱  SMS notification sent              Hier         │ │ │
│ │ │     Your SMS was delivered...          [✉️]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │              [ Charger plus ]                            │ │ ← Load More
│ └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Notification Bell Badge
```
┌──────┐
│🔔(3) │  ← Badge shows unread count
└──────┘
```
- **Icon**: Material icon "notifications"
- **Badge**: Red circular badge with count
- **Badge hidden**: When count is 0
- **Tooltip**: "Notifications"
- **Click**: Opens dropdown menu

### 2. Notification Center Header
```
┌────────────────────────────────────────────────┐
│ 🔔 Notifications                         🔄    │
│              (3)                              │
└────────────────────────────────────────────────┘
```
- **Left**: Bell icon + "Notifications" title + unread badge
- **Right**: Refresh button
- **Background**: Primary theme color
- **Border**: Bottom divider line

### 3. Filter Bar
```
┌────────────────────────────────────────────────┐
│ [ All ] [ IN_APP ] [ Email ] [ SMS ] [ WhatsApp ] │
└────────────────────────────────────────────────┘
```
- **Component**: Material Button Toggle Group
- **Options**: All, IN_APP, Email, SMS, WhatsApp
- **Selected**: Highlighted with primary color
- **Behavior**: Single selection, triggers filter

### 4. Notification List

#### Date Grouping Header
```
┌────────────────────────────────────────────────┐
│ AUJOURD'HUI                                    │
└────────────────────────────────────────────────┘
```
- **Text**: Uppercase, small font
- **Background**: Light gray (sticky header)
- **Values**: "Aujourd'hui", "Hier", or full date

#### Notification Item (Unread)
```
┌────────────────────────────────────────────────┐
│🔵 📧  New message received        Il y a 5min │
│      You have a new message...    [✉️]       │
│      IN_APP                                   │
└────────────────────────────────────────────────┘
```
Components:
- **🔵 Blue dot**: Unread indicator (left edge)
- **📧 Icon**: Type-specific icon (email, SMS, WhatsApp, bell)
- **Title**: Bold notification subject
- **Message**: Gray preview text (truncated)
- **Time**: Relative time ("Il y a 5min")
- **Badge**: Notification type label
- **Action**: Mark as read button (hover to show)
- **Background**: Light blue for unread

#### Notification Item (Read)
```
┌────────────────────────────────────────────────┐
│   📁  Dossier status changed      Il y a 2h   │
│      Status changed to...         [✉️]        │
│      IN_APP                                   │
└────────────────────────────────────────────────┘
```
Components:
- **No blue dot**: Read notification
- **Regular background**: White/default
- **Action**: Mark as unread button (hover to show)
- **Click**: Navigates to action URL

### 5. Empty State
```
┌────────────────────────────────────────────────┐
│                                                │
│              🔔                                │
│                                                │
│       Aucune notification                      │
│                                                │
└────────────────────────────────────────────────┘
```
- **Icon**: Large gray bell icon
- **Text**: "Aucune notification"
- **Center aligned**: Vertically and horizontally

### 6. Loading State
```
┌────────────────────────────────────────────────┐
│                                                │
│              ⏳                                │
│                                                │
│   Chargement des notifications...              │
│                                                │
└────────────────────────────────────────────────┘
```
- **Spinner**: Material spinner
- **Text**: "Chargement des notifications..."
- **Center aligned**: Vertically and horizontally

### 7. Load More Button
```
┌────────────────────────────────────────────────┐
│              [ Charger plus ]                  │
└────────────────────────────────────────────────┘
```
- **Component**: Material stroked button
- **Text**: "Charger plus"
- **Position**: Bottom of list
- **Visibility**: Hidden when no more notifications

## Interaction Flow

### Opening Notification Center
```
User Action → UI Response
────────────────────────────
Click bell  → Dropdown opens
              Loading spinner shows
              Notifications load
              Spinner hides
              List displays
```

### Reading a Notification
```
User Action → UI Response
────────────────────────────
Click item  → Mark as read API call
              Blue dot disappears
              Background changes to white
              Badge count decrements
              Navigate to action URL
```

### Filtering Notifications
```
User Action → UI Response
────────────────────────────
Click filter → Selected filter highlights
               List clears
               Loading spinner shows
               Filtered notifications load
               Spinner hides
               Filtered list displays
```

### Marking as Unread
```
User Action → UI Response
────────────────────────────
Click ✉️    → Mark as unread API call
(read item)   Blue dot appears
              Background changes to blue
              Badge count increments
              Item moves in sort order
```

## Color Scheme

### Light Theme
- **Primary**: Blue (#3f51b5)
- **Warn**: Red (#f44336)
- **Background**: White (#ffffff)
- **Hover**: Light gray (#f5f5f5)
- **Unread**: Light blue (#e3f2fd)
- **Text Primary**: Dark gray (#212121)
- **Text Secondary**: Medium gray (#757575)
- **Divider**: Light gray (#e0e0e0)

### Dark Theme
- **Background**: Dark gray (#303030)
- **Hover**: Darker gray (#424242)
- **Unread**: Dark blue (#1e3a5f)
- **Text Primary**: White (#ffffff)
- **Text Secondary**: Light gray (#b0b0b0)
- **Divider**: Dark gray (#424242)

## Responsive Behavior

### Desktop (>600px)
```
┌─────────────────────────────────┐
│ Dropdown width: 400px           │
│ Height: max 600px               │
│ Position: Below bell icon       │
│ Overflow: Vertical scroll       │
└─────────────────────────────────┘
```

### Mobile (<600px)
```
┌─────────────────────────────────┐
│ Full screen overlay             │
│ Width: 100vw                    │
│ Height: 100vh                   │
│ Position: Fixed                 │
│ Overflow: Vertical scroll       │
└─────────────────────────────────┘
```

## Accessibility Features

### Keyboard Navigation
```
Tab       → Navigate between elements
Enter     → Activate notification
Space     → Activate notification
Esc       → Close dropdown
```

### Screen Reader Announcements
```
"Notifications"
"3 unread notifications"
"Notification: New message received - Unread"
"Mark as read"
"Mark as unread"
"Filter by Email"
"Load more notifications"
```

### Focus Indicators
- **Blue outline**: 2px solid primary color
- **Visible on**: Tab navigation
- **Applied to**: All interactive elements

## Performance Indicators

### Loading States
```
State         → Indicator
──────────────────────────
Initial load  → Full spinner
Filtering     → Full spinner
Load more     → Button disabled
Refreshing    → Refresh icon spins
```

### Empty States
```
State              → Display
─────────────────────────────
No notifications   → Empty icon + text
All filtered out   → Empty icon + text
Error loading      → Error message
```

## Notification Type Icons

```
Type        → Icon
─────────────────────
IN_APP      → 🔔 notifications
EMAIL       → 📧 email
SMS         → 📱 sms
WHATSAPP    → 💬 chat
```

## Badge Behavior

```
Count → Display
───────────────
0     → Hidden
1-9   → "1" to "9"
10+   → "10" to "99"
100+  → "99+"
```

## Animation & Transitions

### Dropdown Opening
- **Duration**: 200ms
- **Easing**: ease-in-out
- **Transform**: scale(0.95) to scale(1)
- **Opacity**: 0 to 1

### Item Hover
- **Duration**: 150ms
- **Easing**: ease
- **Background**: fade to hover color

### Badge Count Change
- **Duration**: 300ms
- **Easing**: ease-out
- **Effect**: Number change with fade

### Mark as Read
- **Duration**: 200ms
- **Easing**: ease
- **Effect**: Background color transition
- **Blue dot**: Fade out

## Z-Index Hierarchy
```
Layer           → Z-Index
────────────────────────
Notification    → 1000
Dropdown menu   → 1001
Notification    → 1002
center overlay
```
