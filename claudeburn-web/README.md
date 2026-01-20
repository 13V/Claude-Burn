# 🔥 Claude Burn Website

Official website showcasing all tokens using the Claude Burn ecosystem.

## Features

- 🎨 **Premium Design** - Dark mode with fire gradients and glassmorphism
- 📊 **Live Stats** - Real-time token count, total burned, active burns
- 🃏 **Token Cards** - Interactive cards with DexScreener charts
- 🔄 **Auto-Refresh** - Data updates every 30 seconds
- 📱 **Responsive** - Mobile-friendly design

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Connect your GitHub repository
2. Vercel will auto-detect Next.js
3. Deploy!

**Important:** Ensure the bot's database is accessible to the website. You may need to:
- Host the bot on the same server
- Use a shared database
- Or create an API endpoint on the bot for the website to query

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Better SQLite3** - Database access

## Customization

### Colors

Edit `app/globals.css` to change the theme:

```css
:root {
  --accent-primary: #ff6b35;
  --accent-secondary: #f7931a;
}
```

### Stats Refresh Rate

Edit `app/page.tsx`:

```typescript
const interval = setInterval(fetchData, 30000); // Change 30000ms
```

## License

MIT
