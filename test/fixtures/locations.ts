import type { Location } from "../../types/location";

export const validLocations: Location[] = [
    {
        id: "goiania-park-1",
        name: "Bosque dos Buritis",
        category: "park",
        latitude: -16.6766,
        longitude: -49.2643,
        address: "Setor Oeste, Goiânia - GO",
        source: "openstreetmap",
    },
    {
        id: "goiania-cafe-1",
        name: "Café com Leitura",
        category: "cafe",
        latitude: -16.6861,
        longitude: -49.2642,
        openingHours: "Mo-Sa 08:00-22:00",
        source: "openstreetmap",
    },
    {
        id: "goiania-library-1",
        name: "Biblioteca Central",
        category: "library",
        latitude: -16.68,
        longitude: -49.25,
        phone: "+55 62 3333-4444",
        websiteUrl: "https://biblioteca.example.com",
        source: "fallback",
    },
    {
        id: "goiania-museum-1",
        name: "Museu de Arte",
        category: "museum",
        latitude: -16.6704,
        longitude: -49.2549,
        source: "openstreetmap",
    },
    {
        id: "goiania-bookstore-1",
        name: "Livraria Palavra",
        category: "bookstore",
        latitude: -16.7027,
        longitude: -49.269,
        source: "fallback",
    },
];

export const locationWithMinimalFields: Location = {
    id: "goiania-minimal-1",
    name: "Lugar Minimal",
    category: "park",
    latitude: -16.69,
    longitude: -49.28,
    source: "fallback",
};

export const locationWithAllFields: Location = {
    id: "goiania-complete-1",
    name: "Lugar Completo",
    category: "cafe",
    latitude: -16.695,
    longitude: -49.275,
    address: "Rua 1, 123",
    openingHours: "08:00-18:00",
    phone: "+55 62 9999-8888",
    websiteUrl: "https://example.com",
    source: "openstreetmap",
};
