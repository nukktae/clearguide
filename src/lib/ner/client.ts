/**
 * NER client interface
 * Supports multiple backends: Cloudflare Worker, HuggingFace API, or fallback
 */

import { NEREntity, NERResult } from './types';
import { extractNERFromHuggingFace } from './huggingface-fallback';

export interface NERClient {
  extractEntities(text: string): Promise<NERResult>;
}

/**
 * Default NER client implementation
 * Tries Cloudflare Worker first, falls back to HuggingFace API
 */
export class DefaultNERClient implements NERClient {
  private cloudflareWorkerUrl?: string;
  private huggingFaceApiKey?: string;

  constructor() {
    this.cloudflareWorkerUrl = process.env.NER_CLOUDFLARE_WORKER_URL;
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
  }

  async extractEntities(text: string): Promise<NERResult> {
    // Try Cloudflare Worker first if configured
    if (this.cloudflareWorkerUrl) {
      try {
        return await this.extractFromCloudflareWorker(text);
      } catch (error) {
        console.warn('[NER Client] Cloudflare Worker failed, falling back to HuggingFace:', error);
      }
    }

    // Fallback to HuggingFace API
    if (this.huggingFaceApiKey) {
      try {
        return await extractNERFromHuggingFace(text, this.huggingFaceApiKey);
      } catch (error) {
        console.error('[NER Client] HuggingFace API failed:', error);
        throw new Error('NER extraction failed: All backends unavailable');
      }
    }

    // If no backend configured, return empty result
    console.warn('[NER Client] No NER backend configured, returning empty result');
    return {
      entities: [],
      text,
      model: 'none',
    };
  }

  private async extractFromCloudflareWorker(text: string): Promise<NERResult> {
    if (!this.cloudflareWorkerUrl) {
      throw new Error('Cloudflare Worker URL not configured');
    }

    const response = await fetch(this.cloudflareWorkerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker returned ${response.status}`);
    }

    const data = await response.json();
    return {
      entities: data.entities || [],
      text,
      model: 'koelectra-cloudflare',
    };
  }
}

/**
 * Create NER client instance
 */
export function createNERClient(): NERClient {
  return new DefaultNERClient();
}

