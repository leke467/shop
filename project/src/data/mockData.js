// Shop feature flags to control shop display
export const mockFeatureFlags = {
  'shop-1': {
    productListings: true,
    customOrders: true,
    reviews: true,
    contact: true,
    shipping: true,
    socialLinks: true
  },
  'shop-2': {
    productListings: true,
    customOrders: false,
    reviews: true,
    contact: true,
    shipping: true,
    socialLinks: false
  },
  'shop-3': {
    productListings: true,
    customOrders: true,
    reviews: false,
    contact: true,
    shipping: false,
    socialLinks: true
  }
}

// Shop data
export const mockShops = [
  {
    id: 'shop-1',
    name: 'TechGadgets',
    description: 'Cutting-edge tech gadgets for modern living',
    logo: 'https://images.pexels.com/photos/2536965/pexels-photo-2536965.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    banner: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ownerName: 'Alex Johnson',
    email: 'alex@techgadgets.com',
    phone: '(555) 123-4567',
    address: '123 Tech Street, Digital City, 90210',
    categories: ['Electronics', 'Gadgets', 'Smart Home'],
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981'
    },
    socialLinks: {
      facebook: 'https://facebook.com/techgadgets',
      instagram: 'https://instagram.com/techgadgets',
      twitter: 'https://twitter.com/techgadgets'
    },
    createdAt: '2023-01-15T08:30:00Z',
    rating: 4.8
  },
  {
    id: 'shop-2',
    name: 'EcoEssentials',
    description: 'Sustainable products for an eco-friendly lifestyle',
    logo: 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    banner: 'https://images.pexels.com/photos/3735161/pexels-photo-3735161.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ownerName: 'Sarah Greene',
    email: 'sarah@ecoessentials.com',
    phone: '(555) 234-5678',
    address: '456 Green Ave, Eco Park, 80210',
    categories: ['Home & Living', 'Sustainable', 'Kitchen'],
    colors: {
      primary: '#10B981',
      secondary: '#6366F1'
    },
    socialLinks: {
      facebook: 'https://facebook.com/ecoessentials',
      instagram: 'https://instagram.com/ecoessentials'
    },
    createdAt: '2023-02-20T10:15:00Z',
    rating: 4.5
  },
  {
    id: 'shop-3',
    name: 'FashionForward',
    description: 'Trending fashion for the style-conscious',
    logo: 'https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    banner: 'https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ownerName: 'Miguel Rodriguez',
    email: 'miguel@fashionforward.com',
    phone: '(555) 345-6789',
    address: '789 Style Blvd, Trendy Heights, 70210',
    categories: ['Clothing', 'Accessories', 'Footwear'],
    colors: {
      primary: '#EC4899',
      secondary: '#8B5CF6'
    },
    socialLinks: {
      instagram: 'https://instagram.com/fashionforward',
      twitter: 'https://twitter.com/fashionforward',
      pinterest: 'https://pinterest.com/fashionforward'
    },
    createdAt: '2023-03-10T09:45:00Z',
    rating: 4.7
  }
]

// Product data
export const mockProducts = [
  {
    id: 'product-1',
    shopId: 'shop-1',
    shopName: 'TechGadgets',
    name: 'Smart Home Hub',
    description: 'Control your entire home with this advanced smart hub. Compatible with all major smart home systems.',
    price: 129.99,
    image: 'https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/4219175/pexels-photo-4219175.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Electronics', 'Smart Home'],
    features: [
      'Voice control compatible', 
      'Integrates with 100+ smart devices', 
      'Energy monitoring'
    ],
    inventory: 45,
    rating: 4.8,
    reviewCount: 124,
    createdAt: '2023-02-01T14:30:00Z'
  },
  {
    id: 'product-2',
    shopId: 'shop-1',
    shopName: 'TechGadgets',
    name: 'Wireless Earbuds',
    description: 'Crystal clear audio with noise cancellation and 30-hour battery life.',
    price: 89.99,
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Electronics', 'Audio', 'Gadgets'],
    features: [
      'Active noise cancellation', 
      '30-hour battery life', 
      'Touch controls'
    ],
    inventory: 78,
    rating: 4.6,
    reviewCount: 95,
    createdAt: '2023-02-15T09:45:00Z'
  },
  {
    id: 'product-3',
    shopId: 'shop-2',
    shopName: 'EcoEssentials',
    name: 'Reusable Produce Bags (Set of 8)',
    description: 'Durable, washable mesh bags for plastic-free grocery shopping.',
    price: 16.99,
    image: 'https://images.pexels.com/photos/5217978/pexels-photo-5217978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/5217978/pexels-photo-5217978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/5217977/pexels-photo-5217977.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Kitchen', 'Sustainable', 'Home & Living'],
    features: [
      'Machine washable', 
      'Transparent mesh design', 
      'Tare weight on label'
    ],
    inventory: 120,
    rating: 4.9,
    reviewCount: 210,
    createdAt: '2023-03-05T11:20:00Z'
  },
  {
    id: 'product-4',
    shopId: 'shop-2',
    shopName: 'EcoEssentials',
    name: 'Bamboo Cutlery Set',
    description: 'Portable bamboo cutlery set with carrying case. Perfect for eco-conscious dining on the go.',
    price: 12.99,
    image: 'https://images.pexels.com/photos/3669640/pexels-photo-3669640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/3669640/pexels-photo-3669640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/3669636/pexels-photo-3669636.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Kitchen', 'Sustainable', 'Travel'],
    features: [
      'Includes fork, knife, spoon, chopsticks', 
      'Canvas carrying pouch', 
      'Dishwasher safe'
    ],
    inventory: 85,
    rating: 4.7,
    reviewCount: 78,
    createdAt: '2023-03-12T10:10:00Z'
  },
  {
    id: 'product-5',
    shopId: 'shop-3',
    shopName: 'FashionForward',
    name: 'Minimalist Watch',
    description: 'Elegant timepiece with a slim profile and sustainable leather strap.',
    price: 79.99,
    image: 'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/2783873/pexels-photo-2783873.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Accessories', 'Watches'],
    features: [
      'Japanese quartz movement', 
      'Vegan leather strap', 
      'Water resistant to 30m'
    ],
    inventory: 60,
    rating: 4.5,
    reviewCount: 65,
    createdAt: '2023-03-20T15:00:00Z'
  },
  {
    id: 'product-6',
    shopId: 'shop-3',
    shopName: 'FashionForward',
    name: 'Canvas Tote Bag',
    description: 'Stylish yet practical canvas tote for everyday use. Ample space for all your essentials.',
    price: 34.99,
    image: 'https://images.pexels.com/photos/5706266/pexels-photo-5706266.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    gallery: [
      'https://images.pexels.com/photos/5706266/pexels-photo-5706266.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/5706265/pexels-photo-5706265.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    categories: ['Accessories', 'Bags'],
    features: [
      'Organic cotton canvas', 
      'Interior pocket', 
      'Reinforced straps'
    ],
    inventory: 95,
    rating: 4.8,
    reviewCount: 112,
    createdAt: '2023-03-25T13:15:00Z'
  }
]

// Category data
export const mockCategories = [
  {
    id: 'cat-1',
    name: 'Electronics',
    image: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 24
  },
  {
    id: 'cat-2',
    name: 'Kitchen',
    image: 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 18
  },
  {
    id: 'cat-3',
    name: 'Clothing',
    image: 'https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 36
  },
  {
    id: 'cat-4',
    name: 'Accessories',
    image: 'https://images.pexels.com/photos/1856413/pexels-photo-1856413.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 27
  },
  {
    id: 'cat-5',
    name: 'Smart Home',
    image: 'https://images.pexels.com/photos/1034812/pexels-photo-1034812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 12
  },
  {
    id: 'cat-6',
    name: 'Sustainable',
    image: 'https://images.pexels.com/photos/5706216/pexels-photo-5706216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    count: 20
  }
]