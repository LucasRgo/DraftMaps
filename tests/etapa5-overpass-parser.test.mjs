import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const parserPath = path.join(projectRoot, "worker/overpassParser.ts");

function compileParser() {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "draftmaps-etapa5-"),
  );

  try {
    execFileSync(
      "node_modules/.bin/tsc",
      [
        "--outDir",
        outputDirectory,
        "--rootDir",
        projectRoot,
        "--module",
        "NodeNext",
        "--moduleResolution",
        "NodeNext",
        "--target",
        "ES2022",
        "--lib",
        "ES2022,DOM",
        "--skipLibCheck",
        parserPath,
      ],
      {
        cwd: projectRoot,
        stdio: "pipe",
      },
    );

    return {
      cleanup() {
        fs.rmSync(outputDirectory, { recursive: true, force: true });
      },
      moduleUrl: pathToFileURL(
        path.join(outputDirectory, "worker/overpassParser.js"),
      ).href,
    };
  } catch (error) {
    fs.rmSync(outputDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function loadParserModule() {
  const compiledParser = compileParser();

  try {
    return {
      cleanup: compiledParser.cleanup,
      parserModule: await import(compiledParser.moduleUrl),
    };
  } catch (error) {
    compiledParser.cleanup();
    throw error;
  }
}

test("Etapa 5 provides the Overpass parser source file", () => {
  assert.equal(fs.existsSync(parserPath), true);
});

test("Etapa 5 normalizes a valid node cafe into a Location", async () => {
  const { parserModule, cleanup } = await loadParserModule();

  try {
    const location = parserModule.normalizeOverpassElementToLocation(
      {
        type: "node",
        id: 2526787874,
        lat: "-16.6861",
        lon: "-49.2642",
        tags: {
          amenity: "cafe",
          name: "  Cafeteria Central  ",
          "addr:street": "Rua 3",
          "addr:housenumber": "120",
        },
      },
      "goiania",
    );

    assert.deepEqual(location, {
      id: "goiania-node-2526787874",
      name: "Cafeteria Central",
      category: "cafe",
      latitude: -16.6861,
      longitude: -49.2642,
      address: "Rua 3, 120",
      source: "openstreetmap",
    });
  } finally {
    cleanup();
  }
});

test("Etapa 5 normalizes a valid way park using center coordinates", async () => {
  const { parserModule, cleanup } = await loadParserModule();

  try {
    const location = parserModule.normalizeOverpassElementToLocation(
      {
        type: "way",
        id: 159590062,
        center: {
          lat: -16.6766,
          lon: -49.2643,
        },
        tags: {
          leisure: "park",
          name: "Bosque dos Buritis",
        },
      },
      "goiania",
    );

    assert.deepEqual(location, {
      id: "goiania-way-159590062",
      name: "Bosque dos Buritis",
      category: "park",
      latitude: -16.6766,
      longitude: -49.2643,
      source: "openstreetmap",
    });
  } finally {
    cleanup();
  }
});

test("Etapa 5 keeps optional fields when they contain useful values", async () => {
  const { parserModule, cleanup } = await loadParserModule();

  try {
    const location = parserModule.normalizeOverpassElementToLocation(
      {
        type: "relation",
        id: 991,
        center: {
          lat: "-16.67",
          lon: "-49.25",
        },
        tags: {
          tourism: "museum",
          name: "Museu Zoroastro Artiaga",
          website: "https://example.com/museu",
          phone: "+55 62 1234-5678",
          opening_hours: "Tu-Su 09:00-17:00",
          "addr:street": "Praça Cívica",
        },
      },
      "goiania",
    );

    assert.deepEqual(location, {
      id: "goiania-relation-991",
      name: "Museu Zoroastro Artiaga",
      category: "museum",
      latitude: -16.67,
      longitude: -49.25,
      address: "Praça Cívica",
      openingHours: "Tu-Su 09:00-17:00",
      phone: "+55 62 1234-5678",
      websiteUrl: "https://example.com/museu",
      source: "openstreetmap",
    });
  } finally {
    cleanup();
  }
});

test("Etapa 5 returns null for unsupported categories and invalid core fields", async () => {
  const { parserModule, cleanup } = await loadParserModule();

  try {
    assert.equal(
      parserModule.normalizeOverpassElementToLocation(
        {
          type: "node",
          id: 10,
          lat: -16.6,
          lon: -49.2,
          tags: {
            amenity: "restaurant",
            name: "Lugar fora do escopo",
          },
        },
        "goiania",
      ),
      null,
    );

    assert.equal(
      parserModule.normalizeOverpassElementToLocation(
        {
          type: "node",
          id: 11,
          lon: -49.2,
          tags: {
            amenity: "library",
            name: "Sem latitude",
          },
        },
        "goiania",
      ),
      null,
    );

    assert.equal(
      parserModule.normalizeOverpassElementToLocation(
        {
          type: "way",
          id: 12,
          center: {
            lat: "not-a-number",
            lon: -49.2,
          },
          tags: {
            leisure: "park",
            name: "Coordenada invalida",
          },
        },
        "goiania",
      ),
      null,
    );

    assert.equal(
      parserModule.normalizeOverpassElementToLocation(
        {
          type: "node",
          id: 13,
          lat: -16.6,
          lon: -49.2,
          tags: {
            shop: "books",
            name: "   ",
            website: "",
          },
        },
        "goiania",
      ),
      null,
    );
  } finally {
    cleanup();
  }
});
