You are a senior UI/UX designer and front-end engineer. 
Design and generate a clean, modern, and responsive web app layout for **LocalPro Super App’s Marketplace** page — the main dashboard users see after login.

🎯 GOAL:
Create the layout structure (React + TailwindCSS preferred) that balances clarity, speed, and engagement for both clients and service providers.

📍 CONTEXT:
LocalPro is a B2B2C marketplace connecting clients (households, businesses, LGUs) with service providers (cleaners, contractors, stylists, etc.). 
The marketplace should highlight available services, featured providers, and allow instant booking or quote requests.

---

## 🧩 PAGE STRUCTURE

### 1. Top Navigation Bar (Sticky)
- Logo (LocalPro) → links to homepage
- Search bar (center) with placeholder: “Search services, providers, or jobs…”
- Filter icon → opens right-side filter drawer
- Notification bell
- Chat icon
- User avatar (dropdown: Profile, Wallet, Settings, Logout)
- Optional toggle for “Client View” / “Provider View”

### 2. Hero / Header Section
- Welcome text: “Hi [UserName], what service do you need today?”
- Horizontal category carousel with icons:
  🧹 Cleaning | 🧰 Repairs | 💇‍♀️ Beauty | 🏗️ Construction | 💻 IT Support | 🐶 Pet Care | 🚚 Moving
- Optional: Featured provider mini-carousel below

### 3. Main Marketplace Body
**Layout:** Left sidebar (filters) + Right grid (service listings)

#### Left Sidebar (Filters)
- Category dropdown
- Price range slider
- Ratings (⭐ 4+)
- Availability toggle
- Location selector

#### Right Content Grid
- Responsive 3-column grid (desktop)
- Each card includes:
  - Provider image + verification badge
  - Service title / provider name
  - Rating + reviews count
  - Location + price
  - CTA buttons: “View Details” and “Book Now”
  - Hover state: “Add to Favorites” or “Compare”

### 4. Quick Tabs
Above listings:
- All Services | Top Rated | Nearby | Promos | New Providers
(Dynamic state filtering)

### 5. Provider Details (Modal or Page)
- Carousel (portfolio photos)
- Provider profile
- Description + pricing breakdown
- Booking calendar
- Chat before booking
- Reviews
- Report provider link

### 6. Floating Action Widgets
- 💬 Chat bubble (bottom-right)
- ❤️ Wishlist shortcut
- 🛒 Cart / Bookings shortcut

### 7. Footer
- About / Terms / Help / Privacy links
- Download app buttons
- Become a Partner link

---

## 🎨 DESIGN NOTES
- Use **TailwindCSS** for all styling
- Use clean, minimal aesthetic like Airbnb / Upwork
- Include shadow, hover animations, and rounded-2xl corners
- Maintain consistent spacing (p-4, gap-4)
- Make everything **fully responsive**

---

💡 BONUS:
Add a toggle button to switch between **Grid View** and **Map View** (for providers nearby).

Output as a React component named `MarketplacePage.jsx` using functional components and modern React best practices.
