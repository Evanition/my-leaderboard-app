// scripts/download-avatars.js

const fs = require('fs');
const path = require('path');
const leaderboardData = require('../public/final_leaderboard.json');

// Define the directory where avatars will be saved
const outputDir = path.join(process.cwd(), 'public', 'avatars');

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The main function to download all avatars
async function downloadAvatars() {
  console.log('Starting avatar download process from MCHeads...');

  // 1. Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. Process players sequentially to be kind to the API
  for (const player of leaderboardData) {
    const playerName = player.Player_Name;
    
    // This URL correctly gets the 32x32 pixel face avatar. This is the one you want.
    const mcHeadsUrl = `https://mc-heads.net/avatar/${playerName}`;
    
    const outputPath = path.join(outputDir, `${playerName}.png`);

    // Skip downloading if the file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`- Avatar for ${playerName} already exists. Skipping.`);
      continue;
    }

    try {
      console.log(`> Fetching avatar for ${playerName}...`);
      const response = await fetch(mcHeadsUrl);
      
      if (!response.ok) {
        console.warn(`- Avatar not found for ${playerName} on MCHeads (status: ${response.status}). Skipping.`);
      } else {
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`+ Successfully downloaded avatar for ${playerName}`);
      }

    } catch (error) {
      console.error(`x Failed to download avatar for ${playerName}:`, error.message);
    }

    // Wait for 0.5 seconds before the next request
    await delay(500);
  }

  console.log('Avatar download process finished.');
}

// Run the function
downloadAvatars();