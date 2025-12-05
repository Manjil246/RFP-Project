# AI-Powered RFP Management System

A comprehensive web application that streamlines the Request for Proposal (RFP) workflow from creation to vendor comparison using AI-powered automation.

## Table of Contents

- [Project Setup](#project-setup)
- [Tech Stack](#tech-stack)
- [API Documentation](#api-documentation)
- [Decisions & Assumptions](#decisions--assumptions)
- [AI Tools Usage](#ai-tools-usage)

---

## Project Setup

### Prerequisites

- **Node.js**: v18+ or **Bun**: v1.0+ (recommended)
- **PostgreSQL**: v14+ (database)
- **Gmail Account**: For sending/receiving emails
- **OpenAI API Key**: For AI-powered features
- **ngrok** (optional): For Gmail webhook callbacks in development

### Install Steps

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd rfp_backend
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .example.env .env
   ```

4. Configure `.env` file with your credentials (see [Email Configuration](#email-configuration))

5. Run database migrations:
   ```bash
   bun run db:migrate
   ```

6. Start the development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

The backend server will start on `http://localhost:3001`

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd rfp_frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .example.env .env
   ```

4. Configure `.env` file:
   ```env
   VITE_API_URL=http://localhost:3001/api/v1
   ```

5. Start the development server:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

The frontend will start on `http://localhost:5173`

### Environment Variables

Copy `.example.env` to `.env` in both `rfp_backend` and `rfp_frontend` directories and fill in the required values.

#### Backend Environment Variables (`.env` in `rfp_backend/`)

**Required:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password (for sending emails)
- `GMAIL_CLIENT_ID` - Google OAuth Client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth Client Secret
- `GMAIL_REFRESH_TOKEN` - OAuth refresh token
- `GMAIL_TOPIC_NAME` - Pub/Sub topic name (full path)
- `GMAIL_SUBSCRIPTION_NAME` - Pub/Sub subscription name (full path)

**Optional:**
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (default: development)
- `FRONTEND_BASE_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `ENABLE_NGROK` - Enable ngrok tunnel (default: false)
- `NGROK_AUTHTOKEN` - ngrok authtoken (if using ngrok)

#### Frontend Environment Variables (`.env` in `rfp_frontend/`)

**Required:**
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api/v1)

### Email Configuration

#### Gmail SMTP Setup (for sending emails)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create an app password for "Mail"
   - Copy the generated password

3. **Configure in `.env`**:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password-here
   ```

#### Gmail API Setup (for receiving emails via webhooks)

**Note:** These are required for email receiving functionality.
- **For detailed OAuth2 setup instructions, refer to this video: [Gmail API OAuth2 Setup Tutorial](https://youtu.be/fyaiEQMmFwE?si=413xMqgcFvC5OP7e)**

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Gmail API**:
   - Navigate to APIs & Services → Library
   - Search for "Gmail API" and enable it

3. **Enable Cloud Pub/Sub API**:
   - Navigate to APIs & Services → Library
   - Search for "Cloud Pub/Sub API" and enable it

4. **Create OAuth 2.0 Credentials**:
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URIs (your ngrok URL or production URL)
   - Note down Client ID and Client Secret

5. **Get Refresh Token**:
   - Use OAuth 2.0 Playground or implement OAuth flow
   - Authorize with Gmail scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - Exchange authorization code for refresh token

6. **Set up Pub/Sub** (for webhooks):
   - Go to Cloud Pub/Sub → Topics
   - Create a topic (e.g., `gmail-notifications`)
   - Note the full topic name: `projects/your-project/topics/gmail-notifications`
   - Create a subscription for the topic
   - Grant Gmail API service account publish permissions to the topic

7. **Configure in `.env`**:
   ```env
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REFRESH_TOKEN=your-refresh-token
   GMAIL_TOPIC_NAME=projects/your-project/topics/gmail-notifications
   GMAIL_SUBSCRIPTION_NAME=projects/your-project/subscriptions/gmail-subscription
   ```

8. **Optional - ngrok for local development**:
   ```env
   ENABLE_NGROK=true
   NGROK_AUTHTOKEN=your-ngrok-authtoken
   ```
   
   This creates a public tunnel to your local server for Gmail webhook callbacks.

### Running Everything Locally

1. **Start PostgreSQL** (if running locally):
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpassword postgres:14
   ```

2. **Start Backend**:
   ```bash
   cd rfp_backend
   bun run dev
   ```

3. **Start Frontend** (in a new terminal):
   ```bash
   cd rfp_frontend
   bun run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api/v1

### Seed Data / Initial Scripts

No seed data is required. The application starts with an empty database. You can:

1. Create vendors through the UI or API
2. Create RFPs using natural language input
3. Send RFPs to vendors
4. Receive vendor responses via email

---

## Tech Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - UI component library (built on Radix UI)
- **Lucide React** - Icon library

### Backend

- **Node.js / Bun** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL** - Relational database
- **Zod** - Schema validation

### AI Integration

- **OpenAI GPT-4o-mini** - Primary LLM for:
  - RFP extraction from natural language
  - Proposal parsing from emails/attachments
  - Proposal comparison and recommendations
- **OpenAI GPT-4o** - Used for vision tasks (parsing images in attachments)

### Email Integration

- **Nodemailer** - SMTP email sending
- **Gmail API** - Email receiving via Pub/Sub webhooks
- **googleapis** - Google APIs client library
- **mailparser** - Email parsing

### File Processing

- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX text extraction
- **xlsx** - Excel file parsing

### Development Tools

- **ngrok** - Local tunneling for webhooks (optional)
- **Drizzle Kit** - Database migrations and studio

---

## API Documentation

All API endpoints are prefixed with `/api/v1`

### RFPs

#### Create RFP from Natural Language
```
POST /api/v1/rfps
Content-Type: application/json

Request Body:
{
  "naturalLanguageText": "I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
}

Success Response (200):
{
  "success": true,
  "message": "RFP created successfully",
  "data": {
    "id": "uuid",
    "title": "Office Equipment Procurement",
    "description": "...",
    "budget": "50000",
    "deadline": "2024-02-15",
    "paymentTerms": "net 30",
    "warranty": "1 year",
    "lineItems": [...],
    ...
  }
}
```

#### Get All RFPs
```
GET /api/v1/rfps

Success Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "status": "draft",
      "lineItems": [...],
      ...
    }
  ]
}
```

#### Get RFP by ID
```
GET /api/v1/rfps/:id

Success Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "lineItems": [...],
    ...
  }
}
```

#### Send RFP to Vendors
```
POST /api/v1/rfps/:id/send
Content-Type: application/json

Request Body:
{
  "vendorIds": ["vendor-uuid-1", "vendor-uuid-2"]
}

Success Response (200):
{
  "success": true,
  "message": "RFP sent to vendors successfully"
}
```

#### Get RFP Vendors
```
GET /api/v1/rfps/:id/vendors

Success Response (200):
{
  "success": true,
  "data": [
    {
      "vendorId": "uuid",
      "vendorName": "...",
      "emailStatus": "sent",
      ...
    }
  ]
}
```

### Vendors

#### Create Vendor
```
POST /api/v1/vendors
Content-Type: application/json

Request Body:
{
  "name": "ABC Corporation",
  "email": "contact@abc.com",
  "contactInfo": {
    "phone": "+91 9876543210",
    "company": "ABC Corporation",
    "address": "123 Main St, City"
  }
}

Success Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC Corporation",
    "email": "contact@abc.com",
    ...
  }
}
```

#### Get All Vendors
```
GET /api/v1/vendors

Success Response (200):
{
  "success": true,
  "data": [...]
}
```

#### Get Vendor by ID
```
GET /api/v1/vendors/:id

Success Response (200):
{
  "success": true,
  "data": {...}
}
```

#### Update Vendor
```
PUT /api/v1/vendors/:id
Content-Type: application/json

Request Body:
{
  "name": "Updated Name",
  "email": "new@email.com",
  "contactInfo": {...}
}
```

#### Delete Vendor
```
DELETE /api/v1/vendors/:id

Success Response (200):
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

### Proposals

#### Get All Proposals
```
GET /api/v1/proposals

Success Response (200):
{
  "success": true,
  "data": [...]
}
```

#### Get Proposal by ID
```
GET /api/v1/proposals/:id

Success Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "rfpId": "uuid",
    "vendorId": "uuid",
    "emailSubject": "...",
    "emailBody": "...",
    "extractedData": {
      "totalPrice": "45000",
      "pricing": {
        "lineItems": [...]
      },
      "deliveryTime": "30 days",
      "paymentTerms": "net 30",
      "warranty": "1 year",
      "additionalTerms": {...}
    },
    "lineItems": [...],
    ...
  }
}
```

#### Get Proposals by RFP ID
```
GET /api/v1/proposals/rfp/:rfpId

Success Response (200):
{
  "success": true,
  "data": [...]
}
```

### Comparisons

#### Get Comparison for RFP
```
GET /api/v1/rfps/:rfpId/compare

Success Response (200):
{
  "success": true,
  "data": {
    "comparison": {
      "proposals": [
        {
          "proposalId": "uuid",
          "vendorId": "uuid",
          "vendorName": "...",
          "totalPrice": "45000",
          "deliveryTime": "30 days",
          "completenessScore": 90,
          "completenessScoreExplanation": "..."
        }
      ],
      "comparisonTable": [
        {
          "criteria": "Total Price",
          "values": {
            "vendor-id-1": "45000",
            "vendor-id-2": "50000"
          },
          "winner": "vendor-id-1"
        }
      ],
      "summary": {
        "totalProposals": 2,
        "priceRange": {
          "min": "45000",
          "max": "50000",
          "average": "47500"
        }
      }
    },
    "recommendation": {
      "vendorId": "uuid",
      "vendorName": "...",
      "reasoning": "Detailed explanation...",
      "score": 92,
      "scoreBreakdown": {
        "priceScore": 95,
        "deliveryScore": 90,
        "completenessScore": 90,
        "termsScore": 88,
        "overallScore": 92,
        "explanation": "..."
      }
    },
    "wasCached": false,
    "computedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get RFP Comparison Data (Overview)
```
GET /api/v1/comparisons/rfp-data

Success Response (200):
{
  "success": true,
  "data": [
    {
      "rfpId": "uuid",
      "rfpTitle": "...",
      "proposalCount": 2,
      "hasComparison": true,
      "compared": true
    }
  ]
}
```

### Statistics

#### Get Dashboard Statistics
```
GET /api/v1/stats/dashboard

Success Response (200):
{
  "success": true,
  "data": {
    "totalRFPs": 10,
    "totalVendors": 5,
    "totalProposals": 15,
    "totalComparisons": 8
  }
}
```

### Webhooks

#### Gmail Pub/Sub Webhook
```
POST /api/v1/webhook

Request Body: (Pub/Sub message format)
{
  "message": {
    "data": "base64-encoded-data",
    "messageId": "...",
    "publishTime": "..."
  }
}

Success Response (200):
{
  "success": true
}
```

### Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (in development)"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Structure

The application uses PostgreSQL with the following tables and relationships:

### Core Tables

#### `rfps`
Stores RFP (Request for Proposal) information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(255) | RFP title |
| `description` | TEXT | Detailed description |
| `budget` | DECIMAL(15,2) | Total budget |
| `deadline` | DATE | Delivery deadline |
| `payment_terms` | VARCHAR(255) | Payment terms (e.g., "net 30") |
| `warranty` | VARCHAR(255) | Warranty requirements |
| `other_terms` | JSONB | Additional flexible terms |
| `status` | ENUM | Status: `draft`, `sent`, `in_review`, `closed` |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `sent_at` | TIMESTAMP | When RFP was sent to vendors |

#### `rfp_line_items`
Stores individual items required in an RFP.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rfp_id` | UUID | Foreign key to `rfps` (CASCADE DELETE) |
| `item_name` | VARCHAR(255) | Name of the item |
| `quantity` | INTEGER | Required quantity |
| `specifications` | JSONB | Item specifications (e.g., `{ram: "16GB", size: "27-inch"}`) |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `vendors`
Stores vendor information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Vendor name |
| `email` | VARCHAR(255) | Vendor email (UNIQUE) |
| `contact_info` | JSONB | Contact details (phone, company, address) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `rfp_vendors`
Junction table tracking which vendors received which RFPs and email sending status.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rfp_id` | UUID | Foreign key to `rfps` (CASCADE DELETE) |
| `vendor_id` | UUID | Foreign key to `vendors` (CASCADE DELETE) |
| `email_status` | ENUM | Status: `pending`, `sent`, `failed` |
| `email_sent_at` | TIMESTAMP | When email was sent |
| `email_message_id` | VARCHAR(500) | Gmail Message-ID for matching replies |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `proposals`
Stores vendor proposal responses parsed from emails.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rfp_id` | UUID | Foreign key to `rfps` (CASCADE DELETE) |
| `vendor_id` | UUID | Foreign key to `vendors` (CASCADE DELETE) |
| `email_subject` | VARCHAR(500) | Original email subject |
| `email_body` | TEXT | Original email body (cleaned, reply content only) |
| `email_message_id` | VARCHAR(255) | Gmail message ID for threading |
| `extracted_data` | JSONB | AI-parsed structured data: `{totalPrice, pricing: {lineItems}, deliveryTime, paymentTerms, warranty, additionalTerms}` |
| `raw_attachments` | JSONB | Metadata about email attachments `[{filename, contentType, size}]` |
| `parsed_at` | TIMESTAMP | When proposal was parsed by AI |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `proposal_line_items`
Stores line items from vendor proposals, matching RFP structure.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `proposal_id` | UUID | Foreign key to `proposals` (CASCADE DELETE) |
| `rfp_line_item_id` | UUID | Foreign key to `rfp_line_items` (SET NULL on delete, for matching) |
| `item_name` | VARCHAR(255) | Item name |
| `quantity` | INTEGER | Quantity |
| `unit_price` | DECIMAL(15,2) | Price per unit |
| `total_price` | DECIMAL(15,2) | Total price for this item |
| `specifications` | JSONB | Item specifications from vendor |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `proposal_comparisons`
Stores AI-generated comparisons and recommendations for RFPs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rfp_id` | UUID | Foreign key to `rfps` (UNIQUE, CASCADE DELETE) |
| `proposal_ids` | JSONB | Array of proposal IDs included in comparison |
| `comparison_data` | JSONB | Structured comparison: `{proposals: [...], comparisonTable: [...], summary: {...}}` |
| `recommendation` | JSONB | AI recommendation: `{vendorId, vendorName, reasoning, score, scoreBreakdown: {...}}` |
| `proposal_hashes` | JSONB | Hash of each proposal (kept for backward compatibility) |
| `compared` | BOOLEAN | Flag indicating if comparison is up-to-date (false when proposals change) |
| `computed_at` | TIMESTAMP | When comparison was computed |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `watch_state`
Tracks Gmail watch state for webhook notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email_address` | VARCHAR(255) | Gmail address being watched (UNIQUE) |
| `last_history_id` | VARCHAR(255) | Last processed Gmail history ID |
| `watch_expiration` | BIGINT | Expiration timestamp from watch (milliseconds) |
| `last_renewed_at` | TIMESTAMP | When watch was last renewed |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Relationships

- **RFPs → RFP Line Items**: One-to-Many (one RFP has many line items, CASCADE DELETE)
- **RFPs → RFP Vendors**: One-to-Many (one RFP sent to many vendors, CASCADE DELETE)
- **Vendors → RFP Vendors**: One-to-Many (one vendor can receive many RFPs, CASCADE DELETE)
- **RFPs → Proposals**: One-to-Many (one RFP can have many proposals, CASCADE DELETE)
- **Vendors → Proposals**: One-to-Many (one vendor can submit many proposals, CASCADE DELETE)
- **Proposals → Proposal Line Items**: One-to-Many (one proposal has many line items, CASCADE DELETE)
- **RFPs → Proposal Comparisons**: One-to-One (one comparison per RFP, UNIQUE constraint, CASCADE DELETE)
- **RFP Line Items → Proposal Line Items**: Optional Many-to-One (proposal items can optionally match RFP items, SET NULL)

### Design Rationale

- **JSONB Fields**: Used for flexible, evolving data structures (AI-extracted data, specifications, contact info, comparison data)
- **Normalized Line Items**: Separate tables ensure data consistency and enable matching between RFPs and proposals
- **Junction Table**: `rfp_vendors` tracks email sending status separately from proposals, enabling tracking of sent RFPs even before proposals are received
- **Comparison Caching**: `compared` flag provides simple cache invalidation mechanism (set to false when proposals change, true after comparison)
- **Email Threading**: `email_message_id` in both `rfp_vendors` and `proposals` enables tracking of email conversations
- **Cascade Deletes**: Ensures data integrity - deleting an RFP removes all related data (line items, vendor associations, proposals, comparisons)
- **Watch State**: Tracks Gmail watch expiration for automatic renewal (Gmail watches expire after 7 days)

---

## Decisions & Assumptions

### Key Design Decisions

#### 1. **Database Schema Design**

**RFPs Table:**
- Used PostgreSQL with JSONB for flexible fields (`otherTerms`)
- Separate `rfp_line_items` table for normalized line item data
- Status enum: `draft`, `sent`, `in_review`, `closed`

**Proposals Table:**
- Stores raw email content (`emailBody`, `emailSubject`)
- Uses JSONB for `extractedData` to store AI-parsed structured data
- Separate `proposal_line_items` table matching RFP structure
- Tracks `emailMessageId` for email threading

**Proposal Comparisons Table:**
- One comparison per RFP (unique constraint)
- Stores full comparison data and recommendation as JSONB
- Includes `compared` flag for cache invalidation
- Stores proposal hashes for change detection (backward compatibility)

**Rationale:** JSONB provides flexibility for evolving AI-extracted data while maintaining queryability. Normalized line items ensure data consistency.

#### 2. **AI Integration Strategy**

**RFP Creation:**
- Single-shot extraction from natural language
- Structured output with validation
- Handles missing fields gracefully

**Proposal Parsing:**
- Multi-format support: email body, DOCX, PDF, XLSX, images
- Vision API for image attachments
- Extracts pricing, terms, delivery, line items
- Handles incomplete or messy vendor responses

**Proposal Merging:**
- When vendor sends multiple emails, uses LLM to intelligently merge
- Preserves latest information while maintaining context
- Updates comparison cache when proposals change

**Comparison & Recommendation:**
- Comprehensive comparison table with all criteria
- AI calculates completeness scores based on RFP requirements
- Detailed score breakdown (price, delivery, completeness, terms)
- Extensive reasoning (3-5 paragraphs) explaining recommendation

**Rationale:** AI is used strategically where unstructured data needs interpretation, not for simple CRUD operations.

#### 3. **Email Integration**

**Sending:**
- SMTP via Nodemailer (simple, reliable)
- HTML email templates with RFP details
- Tracks sent status in `rfp_vendors` junction table

**Receiving:**
- Gmail API with Pub/Sub webhooks (real-time)
- Automatic email processing when vendors reply
- Matches emails to vendors and RFPs automatically
- Processes attachments (DOCX, PDF, XLSX, images)

**Rationale:** SMTP for sending is straightforward. Gmail API webhooks provide real-time processing without polling.

#### 4. **Comparison Caching Strategy**

**Initial Approach:** Hash-based change detection
- Computed hash of proposal data
- Re-compute comparison if hash changed

**Current Approach:** `compared` flag
- Boolean flag in `proposal_comparisons` table
- Set to `false` when proposals are created/updated
- Set to `true` after comparison is computed
- Single aggregated query for overview page

**Rationale:** Simpler, more efficient, easier to reason about than hash comparison.

#### 5. **Frontend Architecture**

**Component Structure:**
- Page-based routing (Dashboard, RFPs, Vendors, Proposals, Compare)
- Reusable UI components (Shadcn/ui)
- Centralized API client with type safety
- Optimistic UI updates where appropriate

**State Management:**
- React hooks (`useState`, `useEffect`)
- No global state library (not needed for single-user app)
- API client handles caching and error states

**Rationale:** Simple, maintainable structure without over-engineering for single-user use case.

#### 6. **Error Handling**

**Backend:**
- Express async error handler
- Zod validation middleware
- Structured error responses
- Detailed logging in development

**Frontend:**
- Try-catch blocks in API calls
- User-friendly error messages
- Loading states for async operations

### Assumptions

1. **Email Format:**
   - Vendors reply to the RFP email (threading)
   - Email subject may or may not reference RFP
   - Vendor email address matches registered vendor email
   - Attachments are common (Word docs, PDFs, Excel)

2. **RFP Structure:**
   - RFPs have line items (items to procure)
   - Budget, deadline, payment terms are common but optional
   - Additional terms can be flexible (stored as JSON)

3. **Proposal Data:**
   - Vendors may send incomplete proposals
   - Pricing may be per-item or total
   - Delivery times are free-form text
   - Terms may vary significantly

4. **Comparison Logic:**
   - Lower price is generally better (within budget)
   - Faster delivery is generally better (within deadline)
   - Completeness matters (all requirements met)
   - All factors are weighted in recommendation

5. **Single User:**
   - No authentication required
   - No multi-tenancy
   - All data belongs to one user

6. **Email Limitations:**
   - Gmail account has sufficient quota
   - Webhook endpoint is publicly accessible (ngrok in dev)
   - App password is secure and not shared

---

## AI Tools Usage

### Tools Used

- **Cursor AI** - Primary IDE assistant
- **ChatGPT** - Design discussions and problem-solving
- **GitHub Copilot** - Code completion and suggestions

### What They Helped With

#### 1. **Initial Architecture Design**
- Discussed database schema options
- Explored AI integration patterns
- Evaluated email integration approaches

#### 2. **Code Generation**
- Boilerplate for Express routes, controllers, services
- TypeScript type definitions
- React component structure
- Database migration scripts

#### 3. **AI Prompt Engineering**
- Refined prompts for RFP extraction
- Improved proposal parsing accuracy
- Enhanced comparison reasoning quality
- Optimized for structured JSON output

#### 4. **Debugging & Problem Solving**
- Resolved Drizzle ORM aggregation issues
- Fixed PostgreSQL UUID MAX() limitations
- Debugged email parsing edge cases
- Optimized API query performance

#### 5. **UI/UX Design**
- Suggested component layouts
- Color scheme recommendations
- Responsive design patterns
- Loading state implementations

### Notable Prompts/Approaches

#### RFP Extraction Prompt:
```
"You are an AI assistant that extracts structured RFP information from natural language descriptions.
Extract: title, description, budget, deadline, paymentTerms, warranty, otherTerms, lineItems.
Return ONLY valid JSON in this exact format: {...}"
```

**Key Features:**
- Explicit JSON schema in prompt
- Examples of expected output
- Validation requirements
- Temperature set to 0 for consistency

#### Proposal Parsing Prompt:
```
"Extract proposal information from vendor email and attachments.
Consider: RFP line items, pricing structure, terms, delivery.
Return structured JSON with pricing.lineItems array matching RFP items."
```

**Key Features:**
- Includes RFP context (requested items)
- Handles multiple attachment types
- Vision API for images
- Graceful handling of incomplete data

#### Comparison Prompt:
```
"Compare proposals and recommend best vendor.
Calculate completeness scores based on RFP requirements.
Provide detailed reasoning (3-5 paragraphs).
Include score breakdown with explanations."
```

**Key Features:**
- Explicit scoring criteria
- Requirement-based evaluation
- Comprehensive reasoning requirement
- Structured output with explanations

### What Was Learned

1. **Prompt Engineering:**
   - Explicit JSON schemas in prompts improve consistency
   - Providing context (RFP requirements) improves accuracy
   - Temperature 0 is crucial for structured outputs
   - Multi-step reasoning (extract → compare → recommend) works well

2. **Error Handling:**
   - AI outputs need validation (Zod schemas)
   - Fallback logic for missing fields
   - Retry mechanisms for API failures
   - User-friendly error messages

3. **Performance:**
   - Batch operations reduce API calls
   - Caching comparisons improves UX
   - Aggregated queries better than N+1
   - Progressive loading for better perceived performance

4. **Data Modeling:**
   - JSONB provides flexibility for AI-extracted data
   - Normalized tables for structured data (line items)
   - Flags (`compared`) simpler than hash comparison
   - Denormalization acceptable for read-heavy operations

5. **User Experience:**
   - Step-by-step loaders improve perceived performance
   - Detailed explanations build trust in AI recommendations
   - Visual comparisons (charts, tables) aid decision-making
   - Clear error messages guide users

### Changes Made Based on AI Tools

1. **Switched from hash-based to flag-based comparison tracking** (simpler, more maintainable)
2. **Added completeness score explanations** (transparency in AI decisions)
3. **Enhanced recommendation reasoning** (from 1 paragraph to 3-5 paragraphs)
4. **Optimized database queries** (single aggregated endpoint instead of multiple calls)
5. **Improved error messages** (more actionable for users)
6. **Added step-by-step loading indicators** (better UX during AI processing)

---

## Project Structure

```
RFP_Task/
├── rfp_backend/          # Backend API server
│   ├── src/
│   │   ├── config/       # Configuration (env, DB connections)
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access layer
│   │   ├── models/       # Database models (Drizzle)
│   │   ├── routes/       # API route definitions
│   │   ├── middlewares/  # Express middlewares
│   │   ├── validationSchemas/ # Zod schemas
│   │   └── database/     # DB connection & migrations
│   ├── drizzle/          # Migration files
│   └── package.json
│
├── rfp_frontend/         # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── layout/   # Layout components
│   │   │   └── ui/       # UI components (Shadcn)
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities & API client
│   │   └── styles/       # Global styles
│   └── package.json
│
└── README.md            # This file
```

---

## Known Limitations

1. **Email Processing:**
   - Only processes emails from registered vendors
   - Requires Gmail account with sufficient quota
   - Webhook requires publicly accessible URL (ngrok in dev)

2. **AI Parsing:**
   - May miss information in very complex attachments
   - Completeness scores are AI-generated (subjective)
   - Requires OpenAI API access and credits

3. **Single User:**
   - No authentication or user management
   - All data is accessible (no access control)
   - Not suitable for multi-user scenarios

4. **Comparison:**
   - Comparison is regenerated when proposals change (no versioning)
   - Historical comparisons are overwritten
   - No export functionality

5. **Email Sending:**
   - Uses SMTP (Gmail app password)
   - No email tracking (opens, clicks)
   - No email templates customization

---

## Future Enhancements

1. **User Authentication:**
   - Multi-user support
   - Role-based access control
   - User preferences

2. **Enhanced Features:**
   - RFP versioning and history
   - Export comparisons to PDF/Excel
   - Email templates customization
   - Email tracking (opens, clicks)

3. **AI Improvements:**
   - Fine-tuned models for better accuracy
   - Support for more file formats
   - Multi-language support
   - Custom scoring weights

4. **Performance:**
   - Background job processing
   - Redis caching
   - Database query optimization
   - CDN for static assets

5. **Monitoring:**
   - Error tracking (Sentry)
   - Analytics
   - Performance monitoring
   - Usage metrics


## Contact

For questions or issues, you can contact me at [manjildhungana.me](https://manjildhungana.me).


