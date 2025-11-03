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

## Railway Deployment

### Prerequisites
- GitHub repository connected (already set up at https://github.com/cornndawwg/training-ai.git)
- Railway account
- PostgreSQL database service

### Steps

1. **Create Railway Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose the `cornndawwg/training-ai` repository

2. **Add PostgreSQL Database**
   - In your Railway project, click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a PostgreSQL database
   - Note the `DATABASE_URL` from the PostgreSQL service variables

3. **Configure Environment Variables**
   - In your Railway project, go to "Variables"
   - Add the following environment variables:
     - `DATABASE_URL_PRIVATE` - Use the `DATABASE_URL` from PostgreSQL (Railway provides this automatically, but copy it here)
     - `JWT_SECRET` - Generate a secure random string (e.g., use `openssl rand -base64 32`)
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `NEXTAUTH_URL` - Your Railway app URL (e.g., `https://your-app-name.up.railway.app`)
     - `NEXTAUTH_SECRET` - Generate another secure random string

4. **Enable pgvector Extension**
   - Railway PostgreSQL may need the pgvector extension enabled
   - You can do this via Railway's database console or by running:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

5. **Deploy**
   - Railway will automatically detect the GitHub push and start building
   - The build process will:
     - Install dependencies
     - Run `prisma generate`
     - Build the Next.js application
   - Once deployed, your app will be available at the Railway-provided URL

### Post-Deployment

1. **Run Database Migrations**
   - After first deployment, you may need to run migrations:
     ```bash
     npx prisma db push
     ```
   - Or connect to your Railway database and run the Prisma migration

2. **Verify Deployment**
   - Visit your Railway app URL
   - You should see the Training AI home page
   - Test creating a user account via the register endpoint

### Monitoring

- Check Railway logs for any errors during build or runtime
- Monitor database connections and performance in Railway dashboard
- Check application health at `https://your-app.up.railway.app`

## Features

- **Process Management**: Create and manage training processes with custom questions
- **Interview System**: Single-phase interviews with process-specific questions
- **Screenshot Upload**: Upload multiple screenshots per question response
- **Markdown Export**: Export interviews to markdown format
- **Knowledge Artifacts**: Automatically create knowledge artifacts with chunks
- **Vector Embeddings**: Generate pgvector embeddings for AI training material generation

## Tech Stack

- **Next.js 16** - React framework
- **PostgreSQL** - Database with pgvector extension
- **Prisma** - ORM
- **OpenAI** - Embeddings generation
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling