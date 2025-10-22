import { NextRequest, NextResponse } from 'next/server';
import { getOrgClientAndId } from '@/lib/org';
import { generateAlbumCoverFromConfig } from '@/lib/ai/albumCoverGenerator';

export async function POST(request: NextRequest) {
  try {
    const { playlistId, playlistName } = await request.json();
    
    if (!playlistId || !playlistName) {
      return NextResponse.json(
        { error: 'Missing playlistId or playlistName' },
        { status: 400 }
      );
    }

    // Get organization ID from auth context
    const { supa, orgId } = await getOrgClientAndId();
    if (!orgId) {
      return NextResponse.json(
        { error: 'No organization in session' },
        { status: 401 }
      );
    }

    // Create a diverse config for the album cover generator
    const genreOptions = [
      ['Electronic', 'Ambient'],
      ['Indie', 'Alternative'],
      ['Jazz', 'Blues'],
      ['Rock', 'Alternative'],
      ['Pop', 'Synthwave'],
      ['Classical', 'Orchestral'],
      ['Hip-Hop', 'Urban'],
      ['Folk', 'Acoustic']
    ];
    
    const moodOptions = [
      ['Energetic', 'Upbeat'],
      ['Melancholic', 'Introspective'],
      ['Dreamy', 'Ethereal'],
      ['Dark', 'Mysterious'],
      ['Bright', 'Optimistic'],
      ['Nostalgic', 'Warm'],
      ['Futuristic', 'Cyberpunk'],
      ['Organic', 'Natural']
    ];
    
    const styleOptions = ['Modern', 'Vintage', 'Minimalist', 'Maximalist', 'Cinematic', 'Abstract', 'Photorealistic', 'Artistic'];
    
    // Randomly select styles for variety
    const selectedGenres = genreOptions[Math.floor(Math.random() * genreOptions.length)];
    const selectedMoods = moodOptions[Math.floor(Math.random() * moodOptions.length)];
    const selectedStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    const energyLevel = Math.floor(Math.random() * 8) + 3; // 3-10 range
    
    const config = {
      playlistTitle: playlistName,
      genres: selectedGenres,
      moods: selectedMoods,
      energy: energyLevel,
      targetContext: 'Professional Music Collection',
      productionStyle: selectedStyle,
      description: `Sophisticated album cover for ${playlistName} with ${selectedStyle.toLowerCase()} aesthetic`
    };

    // Generate album cover using the existing generator
    const result = await generateAlbumCoverFromConfig(config, orgId, playlistId);

    // Update playlist with album cover R2 key
    const { error } = await supa
      .from('playlists')
      .update({ album_cover_r2_key: result.r2Key })
      .eq('id', playlistId);

    if (error) {
      console.error('Failed to update playlist:', error);
      return NextResponse.json(
        { error: 'Failed to update playlist with album cover' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      r2Key: result.r2Key,
      prompt: result.prompt
    });
  } catch (error) {
    console.error('Error generating album cover:', error);
    return NextResponse.json(
      { error: 'Failed to generate album cover' },
      { status: 500 }
    );
  }
}
