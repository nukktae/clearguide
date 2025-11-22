/**
 * Generate KakaoMap URL for searching community centers (주민센터)
 * 
 * Priority:
 * 1. Use extracted location from document (동/구 정보)
 * 2. Use user's geolocation (if available)
 * 3. Fallback to general search
 */

export interface LocationInfo {
  district?: string; // 구
  dong?: string; // 동
  fullAddress?: string;
}

export function generateKakaoMapUrl(
  locationName: string,
  locationInfo?: LocationInfo,
  userLocation?: { lat: number; lng: number }
): string {
  // Check if it's a community center visit
  const isCommunityCenter = 
    locationName.includes("주민센터") || 
    locationName.includes("동주민센터") ||
    locationName.includes("구청") ||
    locationName.includes("시청");

  if (!isCommunityCenter) {
    // For other locations, just search by name
    const query = encodeURIComponent(locationName);
    return `https://map.kakao.com/link/search/${query}`;
  }

  // For community centers, try to be more specific
  let searchQuery = locationName;

  // Add district/dong info if available
  if (locationInfo) {
    if (locationInfo.dong && locationInfo.district) {
      searchQuery = `${locationInfo.district} ${locationInfo.dong} ${locationName}`;
    } else if (locationInfo.district) {
      searchQuery = `${locationInfo.district} ${locationName}`;
    } else if (locationInfo.fullAddress) {
      searchQuery = `${locationInfo.fullAddress} ${locationName}`;
    }
  }

  const query = encodeURIComponent(searchQuery);
  
  // If we have user location, we could use map view, but search is more reliable
  // as it will find the nearest community center
  return `https://map.kakao.com/link/search/${query}`;
}

/**
 * Extract location information from document text
 * Looks for patterns like "서울시 강남구", "강남구 역삼동", etc.
 */
export function extractLocationFromText(text: string): LocationInfo | null {
  if (!text) return null;

  // Common patterns for Korean addresses
  const patterns = [
    // "서울시 강남구 역삼동"
    /([가-힣]+시)?\s*([가-힣]+구)\s*([가-힣]+동)/,
    // "강남구 역삼동"
    /([가-힣]+구)\s*([가-힣]+동)/,
    // "역삼동"
    /([가-힣]+동)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[3]) {
        // Full match: 시 구 동
        return {
          district: match[2],
          dong: match[3],
        };
      } else if (match[2]) {
        // 구 동 match
        return {
          district: match[1],
          dong: match[2],
        };
      } else if (match[1]) {
        // 동 only
        return {
          dong: match[1],
        };
      }
    }
  }

  return null;
}

/**
 * Request user's geolocation
 */
export async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // User denied or error
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  });
}

