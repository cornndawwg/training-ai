# Training AI

Process-based interview system for creating training material.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your database and API keys
```

3. Set up database:
```bash
npx prisma db push
npx prisma generate
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
