import React, { useState, useEffect, useContext } from 'react';
import { Location } from '@/entities/Location';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Check } from 'lucide-react';
import { LocationContext } from './LocationContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function LocationSelector() {
    const { language, dir } = useLanguage();
    const { location, setLocation, isLoading: isLocationLoading } = useContext(LocationContext);
    const [allLocations, setAllLocations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchLocations = async () => {
            const data = await Location.list();
            setAllLocations(data);
            const uniqueCountries = [...new Set(data.map(loc => loc.country))];
            setCountries(uniqueCountries);
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        if (location) {
            setSelectedCountry(location.country);
            setSelectedCity(location.city);
        } else if (!isLocationLoading) {
            setIsOpen(true);
        }
    }, [location, isLocationLoading]);

    useEffect(() => {
        if (selectedCountry) {
            const countryCities = allLocations
                .filter(loc => loc.country === selectedCountry)
                .map(loc => loc.city);
            setCities(countryCities);
            if (!countryCities.includes(selectedCity)) {
                setSelectedCity('');
            }
        } else {
            setCities([]);
        }
    }, [selectedCountry, allLocations, selectedCity]);

    const handleSave = () => {
        if (selectedCountry && selectedCity) {
            setLocation({ country: selectedCountry, city: selectedCity });
            setIsOpen(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 rounded-xl">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {isLocationLoading ? '...' : (location ? `${location.city}, ${location.country}` : (language === 'en' ? 'Select location' : 'حدد موقعك'))}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{language === 'en' ? 'Select your location' : 'حدد موقعك'}</DialogTitle>
                    <DialogDescription>
                        اختر دولتك ومدينتك لعرض الخدمات المتوفرة في منطقتك.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4" dir={dir}>
                    <div className="space-y-1.5">
                        <label className="font-semibold text-sm text-gray-700">{language === 'en' ? 'Country' : 'الدولة'}</label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={language === 'en' ? 'Select country' : 'اختر الدولة'} />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="font-semibold text-sm text-gray-700">{language === 'en' ? 'City' : 'المدينة'}</label>
                        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountry}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={language === 'en' ? 'Select city' : 'اختر المدينة'} />
                            </SelectTrigger>
                            <SelectContent>
                                {cities.map(city => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!selectedCountry || !selectedCity} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                        <Check className="ml-1.5 h-4 w-4" />
                        حفظ الموقع الحالي
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}