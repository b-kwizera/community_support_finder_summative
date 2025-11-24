# Community Support Finder
A web application that helps users locate nearby community support services, such as NGOs, shelters, and aid centers, using the TrueWay Places API. Built with vanilla JavaScript, HTML, and CSS.

## DEMO
Watch the demo video here to see the web app in action:

Demo: [https://www.loom.com/share/655576b6e897426691f86518cd05019e]

Name: Bodgar Kwizera

GitHub: [https://github.com/b-kwizera/community_support_finder_summative]

Website: [www.globalafri.tech]

---

## Project Purpose
This application serves as a practical tool for individuals seeking community support resources. Users can:

- Find nearby organizations, shelters, and aid centers
- Search by category or specific keywords
- View detailed information about each location, including address and contact info
- Filter and sort results to match personal needs

**Real-World Value:** Unlike basic directory apps, this platform provides actionable, location-specific information for users in need, helping them quickly access critical community resources.

---

## Features

### Core Features
- **Location Search:** Users can search for community support services nearby
- **Category Filtering:** Filter by type of service (NGO, shelter, health center, etc.)
- **Search Functionality:** Find locations by keywords
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Interactive Map:** Displays results visually using the TrueWay Places API

### Bonus Features Implemented
- Advanced sorting of locations by distance or relevance
- User personalization (saving favorite locations)
- Performance optimizations (caching API responses)
- Error handling for API downtime or invalid responses

---

## How to Run Locally

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)  
- Internet connection  
- TrueWay Places API key (from RapidAPI)

### Step 1: Get Your TrueWay Places API Key
1. Visit: [https://rapidapi.com/trueway/api/trueway-places](https://rapidapi.com/trueway/api/trueway-places)  
2. Sign up or log in  
3. Copy your API key from the dashboard

### Step 2: Clone or Download
```bash
# Clone the repository
git clone https://github.com/b-kwizera/community_support_finder_summative
cd community_support_finder_summative

# Or download ZIP and extract
```
Step 3: Run the Application
# Simply open index.html in your browser

# On Mac:
open index.html

# On Windows:
start index.html

# On Linux:
xdg-open index.html

Step 4: Enter API Key

Open the application

Paste your TrueWay Places API key when prompted in the configuration

Start searching for community support locations

How to Use
Browsing Locations

Results automatically update when entering search terms or selecting categories

Click on individual locations to view detailed information (address, phone, website)

Use filters to refine results

Searching

Enter keywords such as “shelter”, “NGO”, or “food bank”

Results are displayed with distance and basic information

Error Handling

Displays friendly messages if API calls fail

Placeholder messages for missing data

Handles empty search results gracefully

Deployment Instructions
Deploy to Web Server (Web01 and Web02)
Step 1: Prepare Files
# On your local machine
cd community_support_finder_summative

# Create a deployment package
tar -czf community-support-finder.tar.gz index.html style.css script.js config.js README.md

Step 2: Upload to Servers
# Upload to Web01
scp community-support-finder.tar.gz user@web01-ip:/tmp/
ssh user@web01-ip
cd /var/www/html
sudo mkdir community-support-finder
cd community-support-finder
sudo tar -xzf /tmp/community-support-finder.tar.gz
sudo chown -R www-data:www-data /var/www/html/community-support-finder
sudo chmod -R 755 /var/www/html/community-support-finder

# Repeat for Web02
scp community-support-finder.tar.gz user@web02-ip:/tmp/
ssh user@web02-ip
cd /var/www/html
sudo mkdir community-support-finder
cd community-support-finder
sudo tar -xzf /tmp/community-support-finder.tar.gz
sudo chown -R www-data:www-data /var/www/html/community-support-finder
sudo chmod -R 755 /var/www/html/community-support-finder

Step 3: Configure Apache (if needed)
sudo nano /etc/apache2/sites-available/community-support-finder.conf


Add:

<VirtualHost *:80>
    DocumentRoot /var/www/html/community-support-finder
    <Directory /var/www/html/community-support-finder>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>


Enable site and restart Apache:

sudo a2ensite community-support-finder
sudo systemctl restart apache2

Load Balancer Configuration (Lb01)

Using Nginx

ssh user@lb01-ip
sudo apt update
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/community-support-lb


Add:

upstream community_backend {
    server web01-ip:80;
    server web02-ip:80;
    keepalive 32;
}

server {
    listen 80;
    server_name www.globalafri.tech;

    location / {
        proxy_pass http://community_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
sudo ln -s /etc/nginx/sites-available/community-support-lb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

Testing the Deployment
# Test individual servers
curl http://web01-ip/community-support-finder/
curl http://web02-ip/community-support-finder/

# Test load balancer
curl http://LOAD_BALANCER_IP/


Repeat multiple times to verify traffic distribution.

Technologies Used
Frontend

HTML5: Semantic structure

CSS3: Responsive styling

Vanilla JavaScript (ES6+): Async/Await for API calls, DOM manipulation, event delegation

LocalStorage: Optional data persistence

API

TrueWay Places API (RapidAPI
)
Provides location-based information about community support centers.

Architecture
File Structure
community-support-finder/
├── index.html       # Main HTML structure
├── style.css        # Styling
├── script.js        # Application logic
├── config.js        # API key & configuration
├── README.md        # Documentation
└── .gitignore       # Git ignore rules

Data Flow

User Action → JavaScript Event → API Call → Display Results → Update UI

Features in Detail

Location Search

Enter keywords or select categories

Results display address, contact, and distance

Filtering & Sorting

Filter by service type

Sort by relevance or distance

Error Handling

Handles empty search, invalid API key, network errors

Placeholder images or messages for missing data

API Documentation
TrueWay Places Endpoints Used

Search Nearby Places: GET https://trueway-places.p.rapidapi.com/FindPlacesNearby

Parameters: location, type, radius, language, rapidapi-key

Response Format
{
  "results": [
    {
      "name": "Community Shelter",
      "address": "123 Main St, City",
      "latitude": "12.3456",
      "longitude": "65.4321",
      "phone_number": "+123456789",
      "website": "https://shelter.org"
    }
  ]
}

Rate Limits

Free tier via RapidAPI: as per plan

Use caching (optional) to reduce repeated requests

Challenges Faced & Solutions

API Rate Limiting
Solution: Reduce calls with local caching or debouncing searches

Missing Location Details
Solution: Display placeholders for missing fields

Responsive Layout
Solution: Flexbox and media queries for consistent UI

Scalability Improvements (Future)

Backend for user accounts and saved searches

Caching responses with localStorage or IndexedDB

Containerization with Docker for deployment

CI/CD pipelines for automated updates

Credits
APIs & Services

TrueWay Places API: RapidAPI link

Resources Used

MDN Web Docs: JavaScript, CSS

CSS Tricks: Layout techniques

Stack Overflow: Problem-solving

License

MIT License

© 2025 Bodgar Kwizera

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction...

Contact

Name: Bodgar Kwizera
Email: [mailto:b.kwizera@alustudent.com]
GitHub: [https://github.com/b-kwizera/community_support_finder_summative]
Demo: [https://www.loom.com/share/655576b6e897426691f86518cd05019e]

Built by Bodgar Kwizera using Vanilla JavaScript
