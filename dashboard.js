// Dashboard JavaScript for Weather Forecast Analytics

let temperatureChart, conditionsChart, humidityChart, windSpeedChart;
let temperatureData = [];
let windSpeedData = [];

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        await Promise.all([
            loadSummaryData(),
            loadTemperatureTrends(),
            loadConditionsDistribution(),
            loadHumidityPatterns(),
            loadWindSpeedAnalysis(),
            loadLocationStats()
        ]);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Load summary statistics
async function loadSummaryData() {
    try {
        const [tempResponse, locationResponse] = await Promise.all([
            fetch('/api/temperature-trends'),
            fetch('/api/location-stats')
        ]);

        if (!tempResponse.ok || !locationResponse.ok) throw new Error("API response error");

        const tempData = await tempResponse.json();
        const locationData = await locationResponse.json();

        // Calculate summary statistics
        const totalForecasts = tempData.length;
        const avgTemperature = tempData.reduce((sum, item) => sum + item.temperature, 0) / tempData.length || 0;
        const locationsCount = locationData.length;
        const avgHumidity = locationData.reduce((sum, item) => sum + item.avg_humidity, 0) / locationData.length || 0;

        // Update summary cards
        document.getElementById('total-forecasts').textContent = totalForecasts;
        document.getElementById('avg-temperature').textContent = `${avgTemperature.toFixed(1)}°C`;
        document.getElementById('locations-count').textContent = locationsCount;
        document.getElementById('avg-humidity').textContent = `${avgHumidity.toFixed(1)}%`;

    } catch (error) {
        console.error('Error loading summary data:', error);
    }
}

// Load and display temperature trends
async function loadTemperatureTrends() {
    try {
        const response = await fetch('/api/temperature-trends');
        if (!response.ok) throw new Error("Failed to fetch temperature trends");
        
        temperatureData = await response.json();

        // Get unique locations for filter
        const locations = [...new Set(temperatureData.map(item => item.location))];
        populateLocationFilter('temperature-location-filter', locations);

        createTemperatureChart(temperatureData);

        // Add event listener for location filter if the element exists
        const filterElement = document.getElementById('temperature-location-filter');
        if (filterElement) {
            filterElement.addEventListener('change', function() {
                const selectedLocation = this.value;
                const filteredData = selectedLocation === 'all' ? temperatureData : 
                    temperatureData.filter(item => item.location === selectedLocation);
                createTemperatureChart(filteredData);
            });
        }

    } catch (error) {
        console.error('Error loading temperature trends:', error);
        showChartError('temperatureChart');
    }
}

// Create temperature trends chart
function createTemperatureChart(data) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    if (temperatureChart) {
        temperatureChart.destroy();
    }

    // Group data by location
    const locationGroups = {};
    data.forEach(item => {
        if (!locationGroups[item.location]) {
            locationGroups[item.location] = [];
        }
        locationGroups[item.location].push({
            x: item.date,
            y: item.temperature
        });
    });

    const datasets = Object.keys(locationGroups).map((location, index) => ({
        label: location,
        data: locationGroups[location],
        borderColor: getChartColor(index),
        backgroundColor: getChartColor(index, 0.1),
        tension: 0.4,
        fill: false
    }));

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'll'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                }
            }
        }
    });
}

// Function to get chart colors
function getChartColor(index, opacity = 1) {
    const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];
    return `rgba(${parseInt(colors[index % colors.length].slice(1, 3), 16)}, 
                  ${parseInt(colors[index % colors.length].slice(3, 5), 16)}, 
                  ${parseInt(colors[index % colors.length].slice(5, 7), 16)}, ${opacity})`;
}

