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
- **Authentication**: Custom JWT-based session management
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

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```bash
   # Session Management
   SESSION_SECRET=your-super-secret-key-change-this-in-production
   
   # API Configuration (Development uses http://localhost:5000)
   # Production automatically uses https://localpro-super-app.onrender.com
   # API_BASE_URL=http://localhost:5000  # Optional: override default
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
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

### Marketplace
- `GET /api/marketplace/services` - Get all services
- `GET /api/marketplace/services/nearby` - Get nearby services
- `GET /api/marketplace/services/:id` - Get specific service
- `POST /api/marketplace/services` - Create service (Provider/Admin)
- `PUT /api/marketplace/services/:id` - Update service (Provider/Admin)
- `DELETE /api/marketplace/services/:id` - Delete service (Provider/Admin)
- `POST /api/marketplace/services/:id/images` - Upload service images
- `POST /api/marketplace/bookings` - Create booking
- `GET /api/marketplace/bookings` - Get user bookings
- `PUT /api/marketplace/bookings/:id/status` - Update booking status
- `POST /api/marketplace/bookings/:id/photos` - Upload booking photos
- `POST /api/marketplace/bookings/:id/review` - Add review
- `POST /api/marketplace/bookings/paypal/approve` - Approve PayPal booking
- `GET /api/marketplace/bookings/paypal/order/:orderId` - Get PayPal order details

### Supplies
- `GET /api/supplies` - Get all supplies
- `GET /api/supplies/categories` - Get supply categories
- `GET /api/supplies/featured` - Get featured supplies
- `GET /api/supplies/nearby` - Get nearby supplies
- `GET /api/supplies/:id` - Get specific supply
- `POST /api/supplies` - Create supply (Supplier/Admin)
- `PUT /api/supplies/:id` - Update supply (Supplier/Admin)
- `DELETE /api/supplies/:id` - Delete supply (Supplier/Admin)
- `POST /api/supplies/:id/images` - Upload supply images
- `DELETE /api/supplies/:id/images/:imageId` - Delete supply image
- `POST /api/supplies/:id/order` - Order supply
- `PUT /api/supplies/:id/orders/:orderId/status` - Update order status
- `POST /api/supplies/:id/reviews` - Add supply review
- `GET /api/supplies/my-supplies` - Get my supplies
- `GET /api/supplies/my-orders` - Get my supply orders
- `GET /api/supplies/statistics` - Get supply statistics (Admin)

### Academy
- `GET /api/academy/courses` - Get all courses
- `GET /api/academy/courses/:id` - Get specific course
- `GET /api/academy/categories` - Get course categories
- `GET /api/academy/featured` - Get featured courses
- `POST /api/academy/courses` - Create course (Instructor/Admin)
- `PUT /api/academy/courses/:id` - Update course (Instructor/Admin)
- `DELETE /api/academy/courses/:id` - Delete course (Instructor/Admin)
- `POST /api/academy/courses/:id/thumbnail` - Upload course thumbnail
- `POST /api/academy/courses/:id/videos` - Upload course video
- `DELETE /api/academy/courses/:id/videos/:videoId` - Delete course video
- `POST /api/academy/courses/:id/enroll` - Enroll in course
- `PUT /api/academy/courses/:id/progress` - Update course progress
- `POST /api/academy/courses/:id/reviews` - Add course review
- `GET /api/academy/my-courses` - Get my enrolled courses
- `GET /api/academy/my-created-courses` - Get my created courses
- `GET /api/academy/statistics` - Get course statistics (Admin)

### Finance
- `GET /api/finance/overview` - Get financial overview
- `GET /api/finance/transactions` - Get transactions
- `GET /api/finance/earnings` - Get earnings
- `GET /api/finance/expenses` - Get expenses
- `GET /api/finance/reports` - Get financial reports
- `POST /api/finance/expenses` - Add expense
- `POST /api/finance/withdraw` - Request withdrawal
- `PUT /api/finance/withdrawals/:withdrawalId/process` - Process withdrawal (Admin)
- `GET /api/finance/tax-documents` - Get tax documents
- `PUT /api/finance/wallet/settings` - Update wallet settings

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/user` - Get user analytics
- `GET /api/analytics/marketplace` - Get marketplace analytics
- `GET /api/analytics/custom` - Get custom analytics (Admin)
- `POST /api/analytics/track` - Track event

### Rentals
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/categories` - Get rental categories
- `GET /api/rentals/featured` - Get featured rentals
- `GET /api/rentals/nearby` - Get nearby rentals
- `GET /api/rentals/:id` - Get specific rental
- `POST /api/rentals` - Create rental (Provider/Admin)
- `PUT /api/rentals/:id` - Update rental (Provider/Admin)
- `DELETE /api/rentals/:id` - Delete rental (Provider/Admin)
- `POST /api/rentals/:id/images` - Upload rental images
- `DELETE /api/rentals/:id/images/:imageId` - Delete rental image
- `POST /api/rentals/:id/book` - Book rental
- `PUT /api/rentals/:id/bookings/:bookingId/status` - Update booking status
- `POST /api/rentals/:id/reviews` - Add rental review
- `GET /api/rentals/my-rentals` - Get my rentals
- `GET /api/rentals/my-bookings` - Get my rental bookings
- `GET /api/rentals/statistics` - Get rental statistics (Admin)

### Ads
- `GET /api/ads` - Get all ads
- `GET /api/ads/categories` - Get ad categories
- `GET /api/ads/featured` - Get featured ads
- `GET /api/ads/:id` - Get specific ad
- `POST /api/ads/:id/click` - Track ad click
- `POST /api/ads` - Create ad (Advertiser/Admin)
- `PUT /api/ads/:id` - Update ad (Advertiser/Admin)
- `DELETE /api/ads/:id` - Delete ad (Advertiser/Admin)
- `POST /api/ads/:id/images` - Upload ad images
- `DELETE /api/ads/:id/images/:imageId` - Delete ad image
- `POST /api/ads/:id/promote` - Promote ad
- `GET /api/ads/:id/analytics` - Get ad analytics
- `GET /api/ads/my-ads` - Get my ads
- `GET /api/ads/statistics` - Get ad statistics (Admin)

### Communication
- `GET /api/communication/conversations` - Get conversations
- `GET /api/communication/conversations/:id` - Get specific conversation
- `POST /api/communication/conversations` - Create conversation
- `DELETE /api/communication/conversations/:id` - Delete conversation
- `POST /api/communication/conversations/:id/messages` - Send message
- `PUT /api/communication/conversations/:id/messages/:messageId` - Update message
- `DELETE /api/communication/conversations/:id/messages/:messageId` - Delete message
- `PUT /api/communication/conversations/:id/read` - Mark as read
- `GET /api/communication/unread-count` - Get unread count
- `GET /api/communication/search` - Search conversations

### Maps
- `POST /api/maps/geocode` - Geocode address
- `POST /api/maps/reverse-geocode` - Reverse geocode
- `POST /api/maps/places/search` - Search places
- `GET /api/maps/places/:placeId` - Get place details
- `POST /api/maps/distance` - Calculate distance
- `POST /api/maps/nearby` - Find nearby places
- `POST /api/maps/validate-service-area` - Validate service area
- `POST /api/maps/analyze-coverage` - Analyze service coverage
- `GET /api/maps/test` - Test connection (Admin)

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs` - Create job (Provider/Admin)
- `PUT /api/jobs/:id` - Update job (Provider/Admin)
- `DELETE /api/jobs/:id` - Delete job (Provider/Admin)
- `POST /api/jobs/:id/logo` - Upload company logo
- `GET /api/jobs/:id/stats` - Get job statistics
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/my-applications` - Get my applications
- `GET /api/jobs/my-jobs` - Get my jobs (Provider/Admin)
- `GET /api/jobs/:id/applications` - Get job applications (Provider/Admin)
- `PUT /api/jobs/:id/applications/:applicationId/status` - Update application status (Provider/Admin)

### Providers
- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get specific provider
- `GET /api/providers/profile/me` - Get my provider profile
- `POST /api/providers/profile` - Create provider profile
- `PUT /api/providers/profile` - Update provider profile
- `GET /api/providers/dashboard/overview` - Get provider dashboard
- `GET /api/providers/analytics/performance` - Get provider analytics
- `GET /api/providers/admin/all` - Get all providers for admin
- `PUT /api/providers/admin/:id/status` - Update provider status (Admin)

### Settings
- `GET /api/settings/user` - Get user settings
- `PUT /api/settings/user` - Update user settings
- `GET /api/settings/app` - Get app settings (Admin)
- `PUT /api/settings/app` - Update app settings (Admin)
- `GET /api/settings/app/public` - Get public app settings
- `GET /api/settings/app/health` - Get app health

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