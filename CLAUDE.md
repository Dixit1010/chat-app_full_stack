# Chatty — Project Guide

Real-time 1:1 chat app. Frontend: React + Vite + Zustand + Tailwind. Backend: Express + MongoDB (Mongoose) + Socket.io.

## Design System & UI/UX Directive

This project prioritizes world-class UI/UX as much as functionality. Every screen should feel like a premium modern SaaS product — inspiration from Linear, Vercel, Stripe, Raycast, Arc, Notion, Framer, Apple, Resend, OpenAI, Perplexity — not a generic CRUD/admin-dashboard template. The goal isn't to copy these products, but to match their level of polish, simplicity, motion, and attention to detail.

### Visual language
Modern, premium, elegant, minimal, professional, spacious, intelligent, high-end, interactive.
Avoid: generic, template-based, Bootstrap-like, Material-UI-default, admin-dashboard, overcrowded, flat, outdated.

### Layout
- One clear focal point per screen — never stack multiple equally-important sections.
- Generous spacing, consistent alignment, balanced composition.
- Users should immediately know where to look.

### Components
Every component (buttons, cards, inputs, tables, dropdowns, tabs, sidebars, modals) should feel custom-designed, with subtle depth and refined interaction states — not default library styling.

### Motion
Motion is part of the product: smooth page transitions, scroll-triggered/staggered reveals, hover interactions, micro-interactions, animated counters, skeleton loaders, smooth modal transitions, elegant state changes. Use **Framer Motion** for JS-driven animation. Keep it smooth, premium, and subtle — never flashy or distracting.

### Depth & atmosphere
Layered backgrounds, ambient gradients, soft shadows, subtle glows, glassmorphism where appropriate, blur effects, floating elements. Avoid flat, single-layer UI.

### Typography
Strong heading hierarchy, clean body text, comfortable reading widths, intentional spacing. Font: Inter (via `@fontsource-variable/inter`).

### Color
Restrained palette. One accent color guides attention (indigo) rather than decorating everything; status colors are meaningful (emerald = online/presence only). Avoid rainbow dashboards.

### Empty states
Never blank. Always: subtle illustration/animation + helpful message + guidance (and a clear CTA where one makes sense).

### Loading
Prefer skeleton loaders and smooth/progressive transitions over spinners wherever the content shape is known in advance.

### Responsiveness
Mobile-first. Every screen should feel polished on desktop, laptop, tablet, and mobile — layouts adapt gracefully, not just "stack."

### Consistency
Consistent border radius, shadows, colors, typography, animation timing, spacing, and component behavior across the app — it should read as one cohesive product.

### Final rule
When multiple implementations are possible, pick the one that feels more premium, modern, interactive, and visually memorable. Before implementing any UI, think like a senior product designer first — challenge the requested layout if a better UX exists; don't implement blindly.

## Design tokens (implemented)

Defined as CSS variables in `frontend/src/index.css`, exposed as Tailwind colors in `frontend/tailwind.config.js`, switched via a `dark` class on `<html>` (see `frontend/src/store/useUiThemeStore.js`).

| Token | Purpose |
|---|---|
| `surface` / `surface-2` / `surface-3` | page background / panel background / input & hover background |
| `line` / `line-soft` | borders |
| `ink` / `ink-muted` / `ink-faint` | text: primary / secondary / tertiary |
| `accent` / `accent-hover` / `accent-soft` | indigo — the one primary interactive color |
| `online` | emerald — presence/status only, not decorative |

**Current rollout status:** All pages (Navbar, HomePage, Sidebar, ChatHeader, ChatContainer, MessageInput, NoChatSelected, skeleton loaders, Auth pages, Settings, and Profile) have been successfully migrated to this custom token system. The legacy daisyUI dependency and 32-theme system have been completely removed from the project.

## Stack & constraints
- Backend: Express, MongoDB/Mongoose, Socket.io, Zod validation, helmet + express-rate-limit, JWT cookie auth, Cloudinary for media uploads.
- Frontend: React 18, Vite, Zustand, Tailwind + daisyUI (legacy pages) + custom design tokens (redesigned pages), Framer Motion, react-hot-toast.
- **This project intentionally uses only free/open-source tooling.** When adding infrastructure or AI features, default to self-hosted or free-tier options (e.g. Groq's free tier for LLM features, not a paid API) unless the user explicitly agrees to a paid service.
