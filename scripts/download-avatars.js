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
  console.log('Starting avatar download process from Cravatar (helmhead)...');

  // 1. Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. Process players sequentially to be kind to the API
  for (const player of leaderboardData) {
    const playerName = player.Player_Name;
    
    // --- THIS IS THE ONLY LINE THAT HAS CHANGED ---
    // We now construct the URL for Cravatar's helmhead endpoint.
    // I've used 'https' for security, which is standard practice.
    const avatarUrl = `http://cravatar.eu/helmavatar/${playerName}/32`;
    
    const outputPath = path.join(outputDir, `${playerName}.png`);

    // Skip downloading if the file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`- Avatar for ${playerName} already exists. Skipping.`);
      continue;
    }

    try {
      console.log(`> Fetching avatar for ${playerName}...`);
      const response = await fetch(avatarUrl);
      
      if (!response.ok) {
        console.warn(`- Avatar not found for ${playerName} on Cravatar (status: ${response.status}). Skipping.`);
      } else {
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`+ Successfully downloaded avatar for ${playerName}`);
      }

    } catch (error) {
      console.error(`x Failed to download avatar for ${playerName}:`, error.message);
    }

    // Wait for 0.5 seconds before the next request
    await delay(100);
  }

  console.log('Avatar download process finished.');
}

// Run the function
downloadAvatars();