"use client";

export type UnsplashImageOption = {
  id: string;
  alt: string;
  thumb: string;
  full: string;
};

type UnsplashApiPhoto = {
  id: string;
  alt_description: string | null;
  urls: {
    regular: string;
    small: string;
  };
};

type FallbackImageSeed = {
  id: string;
  alt: string;
  path: string;
};

const UNSPLASH_RANDOM_ENDPOINT = "https://api.unsplash.com/photos/random";

const UNSPLASH_FALLBACK_SEEDS: FallbackImageSeed[] = [
  {
    id: "desert-road",
    alt: "Con duong xuyen qua sa mac",
    path: "photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "forest-stream",
    alt: "Doi rung va dong suoi",
    path: "photo-1441974231531-c6227db76b6e",
  },
  {
    id: "lake-mountain",
    alt: "Ho nuoc va nui cao",
    path: "photo-1501785888041-af3ef285b470",
  },
  {
    id: "night-sky",
    alt: "Bau troi dem day sao",
    path: "photo-1500534314209-a25ddb2bd429",
  },
  {
    id: "sunset-coast",
    alt: "Bai bien luc hoang hon",
    path: "photo-1507525428034-b723cf961d3e",
  },
  {
    id: "snow-peak",
    alt: "Dinh nui tuyet",
    path: "photo-1519681393784-d120267933ba",
  },
  {
    id: "misty-mountain",
    alt: "Nui cao trong suong mo",
    path: "photo-1464822759023-fed622ff2c3b",
  },
  {
    id: "green-valley",
    alt: "Thung lung xanh",
    path: "photo-1476514525535-07fb3b4ae5f1",
  },
  {
    id: "rocky-shore",
    alt: "Bo da ven bien",
    path: "photo-1506744038136-46273834b3fb",
  },
  {
    id: "tropical-beach",
    alt: "Bien nhiet doi",
    path: "photo-1501854140801-50d01698950b",
  },
  {
    id: "city-lights",
    alt: "Thanh pho ve dem",
    path: "photo-1477959858617-67f85cf4f1df",
  },
  {
    id: "autumn-road",
    alt: "Con duong mua thu",
    path: "photo-1470770841072-f978cf4d019e",
  },
  {
    id: "river-canyon",
    alt: "Song chay qua khe nui",
    path: "photo-1447752875215-b2761acb3c5d",
  },
  {
    id: "sea-cliff",
    alt: "Vach da ben bien",
    path: "photo-1439853949127-fa647821eba0",
  },
  {
    id: "pine-forest",
    alt: "Rung thong xanh",
    path: "photo-1448375240586-882707db888b",
  },
  {
    id: "dry-hills",
    alt: "Doi kho duoi nang",
    path: "photo-1500534623283-312aade485b7",
  },
  {
    id: "road-trip",
    alt: "Cung duong du lich",
    path: "photo-1493246507139-91e8fad9978e",
  },
  {
    id: "ocean-view",
    alt: "Tam nhin ra dai duong",
    path: "photo-1493612276216-ee3925520721",
  },
  {
    id: "lavender-sky",
    alt: "Bau troi tim xanh",
    path: "photo-1470770903676-69b98201ea1c",
  },
  {
    id: "volcanic-ridge",
    alt: "Song nui nham thach",
    path: "photo-1511300636408-a63a89df3482",
  },
  {
    id: "cabin-lake",
    alt: "Nha go ben ho",
    path: "photo-1439066615861-d1af74d74000",
  },
  {
    id: "island-view",
    alt: "Dao nho giua bien",
    path: "photo-1465146344425-f00d5f5c8f07",
  },
  {
    id: "cloudy-ridge",
    alt: "Day nui duoi may",
    path: "photo-1469474968028-56623f02e42e",
  },
  {
    id: "golden-field",
    alt: "Canh dong vang",
    path: "photo-1472214103451-9374bd1c798e",
  },
  {
    id: "coastal-drive",
    alt: "Cung duong ven bien",
    path: "photo-1496449903678-68ddcb189a24",
  },
  {
    id: "flower-hills",
    alt: "Doi hoa ven nui",
    path: "photo-1443890923422-7819ed4101c0",
  },
];

function buildUnsplashUrl(path: string, width: number) {
  return `https://images.unsplash.com/${path}?auto=format&fit=crop&w=${width}&q=80`;
}

function shuffleSeeds<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function buildFallbackImages(count: number): UnsplashImageOption[] {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const shuffled = shuffleSeeds(UNSPLASH_FALLBACK_SEEDS);
  const results: UnsplashImageOption[] = [];

  for (let index = 0; index < count; index += 1) {
    const seed = shuffled[index % shuffled.length];
    const loop = Math.floor(index / shuffled.length);

    results.push({
      id: `${seed.id}-${loop}-${nonce}-${index}`,
      alt: seed.alt,
      thumb: buildUnsplashUrl(seed.path, 640),
      full: buildUnsplashUrl(seed.path, 1600),
    });
  }

  return results;
}

function normalizePhoto(photo: UnsplashApiPhoto): UnsplashImageOption {
  return {
    id: photo.id,
    alt: photo.alt_description || "Unsplash background",
    thumb: photo.urls.small,
    full: photo.urls.regular,
  };
}

export async function fetchRandomUnsplashImages(
  count: number,
): Promise<UnsplashImageOption[]> {
  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    return buildFallbackImages(count);
  }

  try {
    const searchParams = new URLSearchParams({
      count: String(count),
      orientation: "landscape",
    });

    const response = await fetch(
      `${UNSPLASH_RANDOM_ENDPOINT}?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Unsplash request failed with ${response.status}`);
    }

    const payload = (await response.json()) as UnsplashApiPhoto[];

    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error("Unsplash returned an empty payload");
    }

    return payload.map(normalizePhoto);
  } catch {
    return buildFallbackImages(count);
  }
}
