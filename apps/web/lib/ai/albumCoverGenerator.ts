/**
 * Album Cover Generation Service
 * Generates album cover images for playlists using AI image generation
 */

import { getOpenAI } from './openai';
import { putObject } from '../r2';
import { z } from 'zod';

// Schema for album cover generation request
const AlbumCoverRequestSchema = z.object({
  playlistTitle: z.string(),
  genres: z.array(z.string()),
  moods: z.array(z.string()),
  energy: z.number().min(1).max(10),
  targetContext: z.string().optional(),
  productionStyle: z.string().optional(),
  description: z.string().optional(),
});

type AlbumCoverRequest = z.infer<typeof AlbumCoverRequestSchema>;

// Album cover generation prompt
const ALBUM_COVER_PROMPT = `
You are an expert album cover designer specializing in photorealistic and artistic album artwork. Generate a detailed, sophisticated prompt for creating a high-quality album cover that captures the essence of a music playlist.

Given the playlist details, create a vivid, descriptive prompt that will generate a compelling, realistic album cover image.

Guidelines:
- Focus on photorealistic visual elements that represent the music's mood, energy, and genre
- Use specific artistic styles: cinematic lighting, professional photography, or fine art aesthetics
- Include atmospheric elements: dramatic lighting, depth of field, texture, and composition
- Make it suitable for a square album cover format (1:1 aspect ratio)
- Avoid text, typography, or obvious AI-generated elements
- Emphasize realism: natural lighting, authentic textures, believable scenes
- Use professional photography terminology: depth of field, chiaroscuro, golden hour lighting
- Consider artistic movements: minimalism, surrealism, abstract expressionism, or contemporary art
- Include specific color palettes and mood descriptors
- Make it suitable for professional music industry standards

Return a single, detailed prompt (3-4 sentences) that describes the visual elements for a photorealistic, artistic album cover.
`;

/**
 * Generate an album cover image for a playlist
 */
export async function generateAlbumCover(
  request: AlbumCoverRequest,
  organizationId: string,
  playlistId: string
): Promise<{ r2Key: string; prompt: string }> {
  const oai = getOpenAI();
  
  // Validate the request
  const validatedRequest = AlbumCoverRequestSchema.parse(request);
  
  // Generate the image prompt
  const promptResponse = await oai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: ALBUM_COVER_PROMPT
      },
      {
        role: "user",
        content: `Generate a photorealistic, artistic album cover prompt for:
- Title: ${validatedRequest.playlistTitle}
- Genres: ${validatedRequest.genres.join(', ')}
- Moods: ${validatedRequest.moods.join(', ')}
- Energy Level: ${validatedRequest.energy}/10
- Target Context: ${validatedRequest.targetContext || 'General listening'}
- Production Style: ${validatedRequest.productionStyle || 'Modern'}
- Description: ${validatedRequest.description || 'No additional description'}

Create a sophisticated, professional album cover that would fit in a high-end music collection. Focus on photorealistic elements, dramatic lighting, and artistic composition.`
      }
    ],
    temperature: 0.8,
    max_tokens: 200
  });

  const imagePrompt = promptResponse.choices[0]?.message?.content?.trim();
  if (!imagePrompt) {
    throw new Error('Failed to generate image prompt');
  }

  // Generate the actual image using DALL-E 3 with HD quality
  const imageResponse = await oai.images.generate({
    model: "dall-e-3",
    prompt: imagePrompt,
    size: "1024x1024", // Square format for album covers
    quality: "hd", // High definition for better realism
    n: 1,
  });

  const imageUrl = imageResponse.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Failed to generate album cover image');
  }

  // Download and upload to R2
  const r2Key = `org_${organizationId}/playlists/${playlistId}/album_cover.png`;
  
  try {
    // Download the image from OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Upload to R2
    await putObject({
      key: r2Key,
      body: new Uint8Array(imageBuffer),
      contentType: 'image/png'
    });

    return {
      r2Key,
      prompt: imagePrompt
    };
  } catch (error) {
    throw new Error(`Failed to upload album cover to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate album cover from playlist config
 */
export async function generateAlbumCoverFromConfig(
  config: any,
  organizationId: string,
  playlistId: string
): Promise<{ r2Key: string; prompt: string }> {
  const request: AlbumCoverRequest = {
    playlistTitle: config.playlistTitle || 'Untitled Playlist',
    genres: config.genres || [],
    moods: config.moods || [],
    energy: config.energy || 5,
    targetContext: config.targetContext,
    productionStyle: config.productionStyle,
    description: config.description,
  };

  return generateAlbumCover(request, organizationId, playlistId);
}
