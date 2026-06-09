import type { Location } from "../types/location";

export const fallbackLocations: Location[] = [
  {
    id: "goiania-bosque-dos-buritis",
    name: "Bosque dos Buritis",
    category: "park",
    latitude: -16.6766,
    longitude: -49.2643,
    address: "Setor Oeste, Goiânia - GO",
    source: "fallback",
  },
  {
    id: "goiania-centro-cultural-marietta",
    name: "Centro Cultural Marietta Telles Machado",
    category: "museum",
    latitude: -16.6704,
    longitude: -49.2549,
    address: "Praça Cívica, Goiânia - GO",
    source: "fallback",
  },
  {
    id: "goiania-livraria-palavra-cafe",
    name: "Palavra Cafe e Livraria",
    category: "bookstore",
    latitude: -16.7027,
    longitude: -49.269,
    websiteUrl: "https://www.instagram.com/palavracafeelivraria/",
    source: "fallback",
  },
];
