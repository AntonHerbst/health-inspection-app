// Mock data for demonstration
const mockInspections = [
    {
        id: 1,
        location: "Warehouse A",
        startTime: "2023-11-15T09:00",
        endTime: "2023-11-15T11:30",
        inspector: "John Doe",
        status: "completed",
        synced: true,
        issueType: "conformance"
    },
    {
        id: 2,
        location: "Office Building",
        startTime: "2023-11-10T13:00",
        endTime: "2023-11-10T15:45",
        inspector: "Jane Smith",
        status: "pending",
        synced: false,
        issueType: "non-conformance"
    }
];

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const googleSignInBtn = document.getElementById('google-signin-btn');
const userName = document.getElementById('user-name');
const inspectionsList = document.getElementById('inspections-list');
const newInspectionBtn = document.getElementById('new-inspection-btn');

// Google Maps API loader
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// GPS Location Functions
function getLocation() {
    const btn = document.getElementById('get-location-btn');
    if (!btn) return;
    
    if (navigator.geolocation) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            showPosition,
            showError,
            { 
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
        
        // Fallback in case the API hangs
        setTimeout(() => {
            if (btn.innerHTML.includes('fa-spinner')) {
                showError({message: "Location request timed out"});
            }
        }, 16000);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const btn = document.getElementById('get-location-btn');
    if (!btn) return;
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const coordsDisplay = document.getElementById('location-coords');
    const accuracy = position.coords.accuracy;
    
    // Display coordinates and accuracy
    coordsDisplay.textContent = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)} (Accuracy: ${Math.round(accuracy)}m)`;
    coordsDisplay.classList.remove('hidden');
    
    // Initialize map
    initMap(lat, lng);
    
    // Reverse geocode to get address
    reverseGeocode(lat, lng);
    
    btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    btn.disabled = false;
}

function showError(error) {
    const btn = document.getElementById('get-location-btn');
    if (!btn) return;
    
    btn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    btn.disabled = false;
    
    // More user-friendly error messages
    let message = 'Error getting location: ';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message += 'Location permission denied. Please enable location services in your browser settings.';
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out. Please try again.';
            break;
        default:
            message += error.message;
    }
    
    alert(message);
}

// Google Maps Functions
let map;
let marker;

function initMap(lat = 0, lng = 0) {
    const mapContainer = document.getElementById('map-container');
    mapContainer.classList.remove('hidden');
    
    map = new google.maps.Map(mapContainer, {
        center: { lat, lng },
        zoom: 15
    });
    
    marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true
    });
    
    // Update address when marker is dragged
    google.maps.event.addListener(marker, 'dragend', function() {
        reverseGeocode(marker.getPosition().lat(), marker.getPosition().lng());
    });
}

function reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
            document.getElementById('location-input').value = results[0].formatted_address;
        }
    });
}

// Custom User Sign-In
googleSignInBtn.addEventListener('click', () => {
    const realUser = {
        name: "Anton Herbst",  // Replace with your name
        email: "your.email@example.com",  // Replace with your email
        lastLogin: new Date().toISOString(),
        role: "inspector"  // Add any custom fields
    };
    
    // Store user data
    localStorage.setItem('currentUser', JSON.stringify(realUser));
    
    // Update UI
    userName.textContent = realUser.name;
    
    // Switch to dashboard
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    dashboard.classList.add('screen-transition');
    
    // Load inspections
    renderInspections();
    
    console.log("User logged in:", realUser.email);
});

// Render inspection cards
function renderInspections() {
    inspectionsList.innerHTML = mockInspections.map(inspection => `
        <div class="inspection-card bg-white rounded-lg shadow p-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold">${inspection.location}</h3>
                    <p class="text-sm text-gray-600">
                        ${formatDate(inspection.startTime)} | 
                        ${formatTime(inspection.startTime)} - ${formatTime(inspection.endTime)}
                    </p>
                    <p class="text-sm">Inspector: ${inspection.inspector}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full 
                    ${inspection.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${inspection.status}
                </span>
            </div>
            <div class="mt-2 flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <span class="text-xs ${inspection.issueType === 'conformance' ? 'text-blue-600' : 'text-red-600'}">
                        <i class="fas ${inspection.issueType === 'conformance' ? 'fa-check-circle' : 'fa-times-circle'} mr-1"></i>
                        ${inspection.issueType === 'conformance' ? 'Conformance' : 'Non-Conformance'}
                    </span>
                    <span class="text-xs ${inspection.synced ? 'text-green-600' : 'text-yellow-600'}">
                        <i class="fas ${inspection.synced ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-1"></i>
                        ${inspection.synced ? 'Synced' : 'Pending'}
                    </span>
                </div>
                <button class="text-blue-500 text-xs font-medium">View Details</button>
            </div>
        </div>
    `).join('');
}

// Findings Management
function setupFindings() {
    const findingsContainer = document.getElementById('findings-container');
    const findingTemplate = document.getElementById('finding-template');
    const addFindingBtn = document.getElementById('add-finding-btn');
    
    if (!findingsContainer || !findingTemplate || !addFindingBtn) return;

    function addFinding() {
        const clone = document.importNode(findingTemplate.content, true);
        const findingNumber = findingsContainer.children.length + 1;
        
        // Update finding number
        clone.querySelector('.finding-number').textContent = findingNumber;
        
        // Set up photo upload
        const photoUpload = clone.querySelector('.photo-upload');
        const photoInput = clone.querySelector('.photo-input');
        const photoPreview = clone.querySelector('.photo-preview');
        
        photoUpload.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    photoPreview.querySelector('img').src = event.target.result;
                    photoPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        // Set up delete button
        clone.querySelector('.delete-finding').addEventListener('click', function() {
            this.closest('.finding-entry').remove();
            updateFindingNumbers();
        });
        
        findingsContainer.appendChild(clone);
    }
    
    function updateFindingNumbers() {
        const findings = findingsContainer.querySelectorAll('.finding-entry');
        findings.forEach((finding, index) => {
            finding.querySelector('.finding-number').textContent = index + 1;
        });
    }
    
    // Add first finding by default
    addFinding();
    
    // Set up click handler for add button
    addFindingBtn.addEventListener('click', addFinding);
}

// New Inspection Button
newInspectionBtn.addEventListener('click', () => {
    window.location.href = 'inspection-form.html';
});

// Date/Time formatting helpers
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(dateString) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString([], options);
}

// Initialize components based on current page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize findings functionality
    setupFindings();

    // Initialize dashboard if on index page
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (userName) userName.textContent = user.name;
        if (loginScreen) loginScreen.classList.add('hidden');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            renderInspections();
        }
    }
});
