import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

const weatherImages = {
    sunny: process.env.PUBLIC_URL + "/folder/sunny.png",
    partlySunny: process.env.PUBLIC_URL + "/folder/partly_sunny.png",
    rainy: process.env.PUBLIC_URL + "/folder/rainy.png",
    thunders: process.env.PUBLIC_URL + "/folder/thunders.png",
    cloudy: process.env.PUBLIC_URL + "/folder/cloudy.png",
    moon: process.env.PUBLIC_URL + "/folder/moon.png",
};

const Home = () => {
    const [searchLocation, setSearchLocation] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [weatherImage, setWeatherImage] = useState(null);
    const [weatherCondition, setWeatherCondition] = useState(""); // Store weather condition text
    const [error, setError] = useState(null);
    const [locationName, setLocationName] = useState(""); // State for location name
    const [currentTime, setCurrentTime] = useState(""); // State for current time
    const [timezone, setTimezone] = useState(""); // State for timezone

    const fetchWeatherData = async (location) => {
        setLoading(true);
        setError(null); // Reset any previous errors
        setWeatherData(null); // Clear previous weather data
        setLocationName(""); // Clear location name
        setTimezone(""); // Clear timezone
        setCurrentTime(""); // Clear current time
        setWeatherCondition(""); // Clear previous weather condition text

        try {
            // Fetch geolocation data
            const geoResponse = await axios.get(
                `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1`
            );

            // If no results are returned, show an error
            if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
                throw new Error("Location not found");
            }

            const { latitude, longitude, name, timezone } = geoResponse.data.results[0];
            setLocationName(name); // Set the city name
            setTimezone(timezone); // Set the timezone

            // Fetch weather data using the latitude and longitude
            const weatherResponse = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
            );

            const data = weatherResponse.data;
            const hourlyData = data.hourly;

            setWeatherData({
                highestTemp: Math.max(...hourlyData.temperature_2m),
                lowestTemp: Math.min(...hourlyData.temperature_2m),
                avgHumidity: (
                    hourlyData.relative_humidity_2m.reduce((a, b) => a + b, 0) / 
                    hourlyData.relative_humidity_2m.length
                ).toFixed(2),
                avgWindSpeed: (
                    hourlyData.wind_speed_10m.reduce((a, b) => a + b, 0) / 
                    hourlyData.wind_speed_10m.length
                ).toFixed(2),
                currentTemp: data.current_weather?.temperature || "N/A",
            });

            // Determine the weather condition for the image
            const weatherCode = data.current_weather.weathercode;
            const currentHour = new Date().toLocaleTimeString("en-US", {
                timeZone: timezone,
                hour12: false,
                hour: "2-digit",
            });
            const isNight = currentHour >= 18 || currentHour < 6; // Check if it's nighttime
            let condition = "sunny";
            let conditionText = "Sunny";

            // Map weather codes to conditions
            if (weatherCode === 0) {
                condition = isNight ? "moon" : "sunny"; // Clear sky - moon at night
                conditionText = isNight ? "Clear Night" : "Sunny";
            } else if (weatherCode === 1 || weatherCode === 2) {
                condition = "partlySunny"; // Partly sunny/cloudy
                conditionText = "Partly Sunny";
            } else if (weatherCode === 3) {
                condition = "cloudy"; // Cloudy
                conditionText = "Cloudy";
            } else if (weatherCode >= 61 && weatherCode <= 67) {
                condition = "rainy"; // Rain, overrides night
                conditionText = "Rainy";
            } else if (weatherCode >= 95 && weatherCode <= 99) {
                condition = "thunders"; // Thunderstorm
                conditionText = "Thunderstorm";
            }

            setWeatherImage(weatherImages[condition] || weatherImages["sunny"]);
            setWeatherCondition(conditionText); // Set weather condition text

            // Get the current time based on timezone
            const currentTime = new Date().toLocaleString("en-US", {
                timeZone: timezone,
            });
            setCurrentTime(currentTime); // Set the current time based on location's timezone

        } catch (error) {
            if (error.message === "Network Error") {
                alert("Network error. Please check your internet connection and try again.");
            }
            setError(error.message); // Set error message
        } finally {
            setLoading(false); // End loading
        }
    };

    const handleSearch = () => {
        if (searchLocation.trim() === "") {
            setError("Please enter a location.");
            return;
        }
        fetchWeatherData(searchLocation); // Trigger the data fetch
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    useEffect(() => {
        if (searchLocation) {
            const interval = setInterval(() => {
                fetchWeatherData(searchLocation);
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [searchLocation]);

    return (
        <div className="container">
            <div className="overlay">
                <h1 className="title">Weather Forecast</h1>
                <div className="input-container">
                    <input
                        type="text"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        onKeyPress={handleKeyPress} // Add this line
                        className="input"
                        placeholder="Enter location"
                    />
                    <button onClick={handleSearch} className="button">
                        Search
                    </button>
                </div>
                {locationName && <h2 style={{ color: "black" }}>{locationName}</h2>}

                {timezone && <p style={{ color : "black"}}>Timezone: {timezone}</p>} {/* Display timezone */}
                {currentTime && <p style={{ color : "black"}}>Time: {currentTime}</p>} {/* Display current time */}

                {loading && (
                    <div className="loading-container">
                        <img src={`${process.env.PUBLIC_URL}/folder/loading.gif`} alt="Loading..." className="loading-gif" />
                    </div>
                )}

                {error && <div style={{ color: "black", fontWeight: "bold" }}>{error}</div>}

                {weatherData && !error && (
                    <div className="weather-info">
                        <div className="weather">
                            <div className="weather-icon">
                                <img src={weatherImage} alt="Weather Condition" />
                            </div>
                            <div className="weather-details">
                                <p className="live-temperature">{weatherData.currentTemp}°C</p>
                                <p>Weather Condition: {weatherCondition}</p>
                                <p>Average Humidity: {weatherData.avgHumidity}%</p>
                                <p>Wind Speed: {weatherData.avgWindSpeed} km/h</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
