# Welcome to your Swiftpick-delivery project

## Project info
# SwiftPick Delivery 🚚

A modern, comprehensive delivery management system that integrates eCommerce platforms with HFD shipping company API. Built for scale, efficiency, and exceptional user experience.

## 🌟 Features

### Core Functionality
- **Multi-platform Integration**: Seamlessly connect Wix, Shopify, WooCommerce, and other eCommerce platforms
- **HFD API Integration**: Full integration with HFD shipping company for creating, tracking, and managing shipments
- **Bulk Operations**: Handle hundreds of shipments with CSV/Excel upload and batch processing
- **Real-time Tracking**: Live status updates and shipment monitoring
- **Label Printing**: Generate and print professional shipping labels
- **Smart Validation**: Automatic address validation and error detection

### Advanced UX/UI
- **Status-Driven Interface**: Clear visual indicators for shipment status
- **Task-Oriented Workflow**: Streamlined process from upload to delivery
- **Mobile-First Design**: Fully responsive with touch-optimized interactions
- **Smart Defaults**: AI-powered suggestions and auto-completion
- **Micro-animations**: Smooth, professional animations for better UX
- **Error Recovery**: Intelligent error handling with suggested fixes

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for blazing fast development
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible components
- **Lucide Icons** for modern iconography

### Backend & Data
- **Supabase** for real-time database and authentication
- **PostgreSQL** for robust data management
- **Row Level Security (RLS)** for data protection

### Integrations
- **HFD Shipping API** - Complete shipping management
- **eCommerce APIs** - Wix, Shopify, WooCommerce support
- **Address Validation** - Israeli postal system integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- HFD API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Dvir-B/swiftpick-delivery-app.git
cd swiftpick-delivery-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and HFD API credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HFD_API_URL=https://api.hfd.co.il
VITE_HFD_CLIENT_NUMBER=your_client_number
VITE_HFD_TOKEN=your_hfd_token
```

## 📖 Usage

### Creating Shipments

1. **Upload CSV/Excel**: Drag and drop your shipment data
2. **Preview & Validate**: Review data with automatic error detection
3. **Bulk Create**: Generate multiple shipments with one click
4. **Track & Monitor**: Real-time status updates

### API Integration

```typescript
// Create shipment example
const shipment = await createShipment({
  clientNumber: 3399,
  mesiraIsuf: "מסירה",
  shipmentTypeCode: 35,
  nameTo: "Customer Name",
  cityName: "תל אביב",
  streetName: "דיזנגוף",
  houseNum: "114",
  telFirst: "0500000000",
  // ... other fields
});
```

## 🏗️ Architecture

### Database Schema (Supabase)
```sql
-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hfd_shipment_number BIGINT,
  reference_number VARCHAR(50),
  status VARCHAR(50),
  recipient_name VARCHAR(100),
  recipient_phone VARCHAR(20),
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status tracking
CREATE TABLE shipment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id),
  status_code VARCHAR(10),
  status_description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### HFD API Integration

#### Supported Operations
- ✅ Create Shipment (`POST /rest/v2/shipments/create`)
- ✅ Track Shipment (`GET /rest/v2/shipments/{SHIP_ID}`)
- ✅ Print Label (`GET /rest/v2/shipments/{SHIP_ID}/label`)
- ✅ Cancel Shipment (`DELETE /rest/v2/shipments/{RANDOM_ID}`)
- ✅ Get Pickup Points (`GET /rest/v2/epost-points`)

#### Shipment Types Supported
| Type | Code | Description |
|------|------|-------------|
| Regular Delivery | 35 | Standard delivery service |
| Return | 35 | Return shipment |
| Delivery + Return | 37 | Combined service |
| Cash Collection | 37 | Payment on delivery |
| Pickup Point | 50 | Delivery to pickup location |

## 🎨 Design System

### Status Indicators
- 📄 **Pending** (Gray) - Awaiting processing
- ⏳ **Processing** (Blue) - Creating shipment
- ✅ **Created** (Green) - Successfully created
- ❌ **Failed** (Red) - Error occurred
- 🚚 **In Transit** (Blue) - On the way

### Color Palette
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)
- **Neutral**: Gray (#6B7280)

## 📊 Features Roadmap

### Current (v1.0)
- [x] HFD API Integration
- [x] Basic shipment creation
- [x] CSV upload and processing
- [x] Status tracking
- [x] Label printing

### Next Release (v1.1)
- [ ] Advanced analytics dashboard
- [ ] Customer notification system
- [ ] API rate limiting and caching
- [ ] Advanced filtering and search
- [ ] Export functionality

### Future (v2.0)
- [ ] Multi-carrier support
- [ ] Advanced routing optimization
- [ ] Customer portal
- [ ] Mobile app
- [ ] AI-powered insights

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### HFD Integration
Full API documentation available at:
- **Swagger**: https://api.hfd.co.il/docs
- **ReDoc**: https://api.hfd.co.il/redoc

### Authentication
```typescript
const headers = {
  'Authorization': `Bearer ${HFD_TOKEN}`,
  'Content-Type': 'application/json'
};
```

## 🔧 Development Tools

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Development with Lovable
This project can be edited using [Lovable](https://lovable.dev/projects/690ed3d8-d7a1-4741-a5a4-b1f386fddd1a) for rapid prototyping and visual development.

## 🚀 Deployment

### Lovable (Recommended)
1. Open [Lovable Project](https://lovable.dev/projects/690ed3d8-d7a1-4741-a5a4-b1f386fddd1a)
2. Click Share → Publish

### Custom Domain (Netlify)
```bash
npm run build
# Deploy dist/ folder to Netlify
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Email**: support@swiftpick.com

## 🏢 About

SwiftPick Delivery is developed to streamline shipping operations for Israeli eCommerce businesses, providing seamless integration with HFD shipping services and modern user experience.

---

**Built with ❤️ for the Israeli eCommerce community**
