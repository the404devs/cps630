import React, {useState, useEffect} from 'react';
import axios from 'axios';


const Weather = () => {
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        const targetCity = document.getElementById('city-input').value;
        setCity(targetCity);
      }
    
    const apiKey = "ac44343b90759cfe705813ff3a614fa5";

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
                setWeather(response.data);
            } catch (err) {
                console.log("Error fetching weather data:", err);
            }
        };

        fetchWeather();
    }, [city]);

    if (!weather) return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>Enter location: 
                    <input type='text' id='city-input' />
                </label>

                <input type='submit' />
            </form>
        </div>
    );

    return (
        <div>
            <h2>Weather in {city}</h2>
            <p>Temperature: {weather.main.temp}</p>
            <p>Conditions: {weather.weather[0].main}</p>

            <form onSubmit={handleSubmit}>
                <label>Enter location: 
                    <input type='text' id='city-input' />
                </label>

                <input type='submit' />
            </form>
        </div>
    );
}

export default Weather;