# LocalPro Super App

A comprehensive super app platform that integrates multiple professional services including marketplace, supplies, education, finance, rentals, and more.

## Features

### Core Modules

1. **Marketplace** - Demand services (Cleaning, Plumbing, Electrical, Moving)
2. **Supplies & Materials** - Resources and goods (Cleaning supplies, Tools, Subscription kits)
3. **Academy** - Educational and certification services (Partner with TES, Run courses, Certification)
4. **Rentals** - Equipment and vehicle rentals (Tool and vehicle rentals)
5. **LocalPro Plus** - Premium tier subscription service (Premium subscriptions, Providers, Clients)
6. **FacilityCare** - Facility-related services (Janitorial contracts, Landscaping maintenance, Pest control subscriptions)
7. **Ads** - Advertising opportunities (Advertising for hardware stores, Suppliers, Training schools)
8. **Finance** - Financial services (Salary advance, Micro-loans, Partner with fintech.company)

### Technical Features

- **Authentication**: Mobile-only authentication with phone verification
- **REST API**: Comprehensive API endpoints for all services
- **External API Integration**: Connects to https://localpro-super-app.onrender.com
- **UI**: Modern, responsive design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Form Validation**: Zod schema validation
- **State Management**: SWR for data fetching

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend API**: External API at https://localpro-super-app.onrender.com
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd localpro-super-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### API Configuration

The application is configured to use the external API at `https://localpro-super-app.onrender.com`. All API requests are automatically proxied to this endpoint.

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify-code` - Verify code
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upload-avatar` - Upload user avatar
- `POST /api/auth/upload-portfolio` - Upload portfolio images
- `POST /api/auth/logout` - User logout
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Marketplace (Client-Side Only)
- `GET /api/marketplace/services` - Get all services
- `GET /api/marketplace/services/nearby` - Get nearby services
- `GET /api/marketplace/services/:id` - Get specific service
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/bookings` - Get user bookings
- `PUT /api/marketplace/bookings/:id/status` - Update booking status
- `POST /api/marketplace/bookings/:id/photos` - Upload booking photos
- `POST /api/marketplace/bookings/:id/review` - Add review
- `POST /api/marketplace/bookings/paypal/approve` - Approve PayPal booking
- `GET /api/marketplace/bookings/paypal/order/:orderId` - Get PayPal order details

### Supplies
- `GET /api/supplies/products` - Get all products
- `POST /api/supplies/products` - Create product
- `GET /api/supplies/orders` - Get user orders
- `POST /api/supplies/orders` - Create order

### Academy
- `GET /api/academy/courses` - Get all courses
- `POST /api/academy/courses` - Create course
- `GET /api/academy/enrollments` - Get user enrollments
- `POST /api/academy/enrollments` - Enroll in course

### Rentals
- `GET /api/rentals/items` - Get rental items
- `POST /api/rentals/items` - Create rental item
- `GET /api/rentals/rentals` - Get user rentals
- `POST /api/rentals/rentals` - Create rental

### Finance
- `GET /api/finance/loans` - Get user loans
- `POST /api/finance/loans` - Apply for loan
- `GET /api/finance/salary-advances` - Get salary advances
- `POST /api/finance/salary-advances` - Request salary advance

### LocalPro Plus
- `GET /api/plus/subscriptions` - Get user subscriptions
- `POST /api/plus/subscriptions` - Create subscription

### FacilityCare
- `GET /api/facility/contracts` - Get facility contracts
- `POST /api/facility/contracts` - Create contract

### Advertising
- `GET /api/ads/advertisements` - Get user advertisements
- `POST /api/ads/advertisements` - Create advertisement

## User Roles

- **CLIENT**: Regular users who can book services, purchase supplies, etc.
- **PROVIDER**: Service providers who offer marketplace services
- **ADMIN**: Platform administrators with full access

## API Integration

The application integrates with the external API at `https://localpro-super-app.onrender.com` which provides:

- **User Management**: Authentication and user profiles
- **Marketplace Services & Bookings**: Service marketplace functionality
- **Supplies Products & Orders**: E-commerce for supplies
- **Academy Courses & Enrollments**: Educational platform
- **Rental Items & Rentals**: Equipment rental system
- **Subscriptions**: Premium service management
- **Facility Contracts**: Facility management services
- **Advertisements**: Advertising platform
- **Loans & Salary Advances**: Financial services

## Development

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── prisma/                # Database schema
```

### Key Components

- **Dashboard**: Main application interface with service modules
- **Authentication**: Phone-only sign in with SMS verification
- **User Profile**: Complete profile management with avatar and portfolio upload
- **Verification Modal**: Phone verification system
- **Service Modules**: Individual components for each service area

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.