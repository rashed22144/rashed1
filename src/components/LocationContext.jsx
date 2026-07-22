import React, { createContext, useState, useEffect } from 'react';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                setLocation(JSON.parse(savedLocation));
            } catch (error) {
                console.error('Error parsing saved location:', error);
            }
        }
        setIsLoading(false);
    }, []);

    const updateLocation = (newLocation) => {
        setLocation(newLocation);
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
    };

    return (
        <LocationContext.Provider value={{
            location,
            setLocation: updateLocation,
            isLoading
        }}>
            {children}
        </LocationContext.Provider>
    );
};