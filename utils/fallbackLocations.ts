import type { Location } from "../types/location";

export const fallbackLocations: Location[] = [
    {
        id: "goiania-bosque-dos-buritis",
        name: "Bosque dos Buritis",
        category: "park",
        latitude: -16.6818406,
        longitude: -49.2619374,
        address: "Setor Oeste, Goiânia - GO",
        source: "fallback",
    },
    {
        id: "goiania-centro-cultural-marietta",
        name: "Centro Cultural Marietta Telles Machado",
        category: "museum",
        latitude: -16.6807077,
        longitude: -49.2559136,
        address: "Praça Cívica, nº 2, Goiânia - GO",
        source: "fallback",
    },
    {
        id: "goiania-livraria-palavrear",
        name: "Livraria Palavrear",
        category: "bookstore",
        latitude: -16.6755350,
        longitude: -49.2484773,
        address: "R. 232, 338 - Setor Leste Universitário, Goiânia - GO",
        websiteUrl: "https://www.instagram.com/palavrearlivraria/",
        source: "fallback",
    },
];
