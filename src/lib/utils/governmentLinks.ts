/**
 * Utility for generating government office links and phone number searches
 */

import { LocationInfo } from "./kakaoMap";

/**
 * Generate phone number search URL
 * Since we can't fetch actual phone numbers, we provide a search link
 */
export function generatePhoneSearchUrl(locationName: string, locationInfo?: LocationInfo): string {
  let searchQuery = locationName;
  
  // Add location context for better search results
  if (locationInfo) {
    if (locationInfo.dong && locationInfo.district) {
      searchQuery = `${locationInfo.district} ${locationInfo.dong} ${locationName} 전화번호`;
    } else if (locationInfo.district) {
      searchQuery = `${locationInfo.district} ${locationName} 전화번호`;
    } else if (locationInfo.dong) {
      searchQuery = `${locationInfo.dong} ${locationName} 전화번호`;
    } else {
      searchQuery = `${locationName} 전화번호`;
    }
  } else {
    searchQuery = `${locationName} 전화번호`;
  }

  // Use Naver search (most popular in Korea)
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodedQuery}`;
}

/**
 * Generate 정부24 (gov.kr) payment link
 */
export function generateGov24Link(): string {
  return "https://www.gov.kr";
}

/**
 * Generate municipal office website URL based on location
 * Note: Korean district names need romanization for URLs
 * For MVP, we'll return null and let users use 정부24 instead
 * Future: Integrate with a Korean romanization library or API
 */
export function generateMunicipalOfficeLink(locationInfo?: LocationInfo): string | null {
  // For MVP, skip municipal office links as they require Korean-to-romanization
  // Users can use 정부24 (gov.kr) which is more reliable
  return null;
}

/**
 * Extract district name from location name
 * e.g., "강남구 주민센터" -> "강남구"
 */
export function extractDistrictFromLocationName(locationName: string): string | null {
  const match = locationName.match(/([가-힣]+구)/);
  return match ? match[1] : null;
}

/**
 * Generate all relevant links for a community center visit
 */
export interface CommunityCenterLinks {
  phoneSearch?: string;
  gov24?: string;
  municipalOffice?: string | null;
}

export function generateCommunityCenterLinks(
  locationName: string,
  locationInfo?: LocationInfo
): CommunityCenterLinks {
  const links: CommunityCenterLinks = {};

  // Phone number search
  links.phoneSearch = generatePhoneSearchUrl(locationName, locationInfo);

  // 정부24 link (always available)
  links.gov24 = generateGov24Link();

  // Municipal office link - disabled for MVP (requires Korean romanization)
  // Future: Enable when proper romanization is available
  links.municipalOffice = null;

  return links;
}

