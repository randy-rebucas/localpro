#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Analyzes the Next.js bundle to identify optimization opportunities.
 * Run with: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 Analyzing Next.js Bundle...\n');

try {
  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if .next directory exists
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('❌ Build failed or .next directory not found');
    process.exit(1);
  }

  console.log('\n✅ Build completed successfully!');
  console.log('\n📦 Bundle Analysis:');
  console.log('   - Check .next/analyze for detailed bundle breakdown');
  console.log('   - Use @next/bundle-analyzer for visual analysis');
  console.log('\n💡 To visualize bundle:');
  console.log('   1. Install: npm install --save-dev @next/bundle-analyzer');
  console.log('   2. Add to next.config.ts');
  console.log('   3. Run: ANALYZE=true npm run build');
  
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}

