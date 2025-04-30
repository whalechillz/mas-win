# MAS Win Project

This project is part of the MAS (Modern Application Services) initiative.

## Getting Started

These instructions will help you set up and run the project locally.

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/whalechillz/mas-win.git
cd mas-win
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

## Deployment

This project is configured for deployment on Vercel.

## Redirect Strategy (2024-05-14)

### Important: Dual Redirect Implementation Required
For reliable redirection in Next.js projects, **both methods must be implemented**:

1. **Server-side Redirect** (Next.js redirects)
```js
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/versions/funnel-2025-05.html',
        permanent: false,
      },
    ];
  },
};
```

2. **Client-side Redirect** (HTML meta refresh)
```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MASGOLF | 리다이렉트</title>
    <meta http-equiv="refresh" content="0;url=/versions/funnel-2025-05.html">
</head>
<body>
    <p>리다이렉트 중...</p>
</body>
</html>
```

### Why Both Methods?
1. **Server-side Redirect**
   - Handles routing at the Next.js server level
   - Better for SEO
   - Immediate redirection when server is operational

2. **Client-side Redirect**
   - Fallback for static hosting scenarios
   - Backup when server configuration isn't active
   - Ensures browser-level redirection

This dual approach ensures reliable redirection in both static hosting and server-side rendering environments.

## License

This project is licensed under the MIT License. 