#!/usr/bin/env node

/**
 * Client Journey Test Runner
 * 
 * A convenient script to run client journey tests with various options
 * Usage: node test-client-journey.js [options]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test phases configuration
const testPhases = {
  '1-3': {
    name: 'Registration, Dashboard, Service Discovery',
    pattern: 'client-journey.test.ts',
    description: 'Phases 1-3: User onboarding and basic functionality'
  },
  '4-6': {
    name: 'Payment, Job Board, Academy',
    pattern: 'client-journey-payment-academy.test.ts',
    description: 'Phases 4-6: Payment processing and learning features'
  },
  '7-9': {
    name: 'Marketplace, Equipment Rental, Financial',
    pattern: 'client-journey-marketplace-financial.test.ts',
    description: 'Phases 7-9: Marketplace and financial management'
  },
  '10-12': {
    name: 'Subscription, Communication, Trust',
    pattern: 'client-journey-subscription-communication.test.ts',
    description: 'Phases 10-12: Advanced features and communication'
  },
  '13-18': {
    name: 'Referral, Analytics, Activity, Settings, Profile, Maps',
    pattern: 'client-journey-final-phases.test.ts',
    description: 'Phases 13-18: Final phases and advanced features'
  },
  'e2e': {
    name: 'End-to-End Integration',
    pattern: 'client-journey-e2e.test.ts',
    description: 'Complete user journey simulation'
  },
  'all': {
    name: 'All Client Journey Tests',
    pattern: 'client-journey',
    description: 'Run all client journey test phases'
  }
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  log('\n🚀 Client Journey Test Runner', 'bright');
  log('================================\n', 'cyan');
  
  log('Usage: node test-client-journey.js [options]\n', 'yellow');
  
  log('Options:', 'bright');
  log('  --phase <phase>     Run specific test phase', 'green');
  log('  --coverage          Generate coverage report', 'green');
  log('  --watch             Run in watch mode', 'green');
  log('  --verbose           Verbose output', 'green');
  log('  --debug             Debug mode with detailed output', 'green');
  log('  --performance       Run performance tests only', 'green');
  log('  --security          Run security tests only', 'green');
  log('  --help              Show this help message', 'green');
  
  log('\nAvailable Phases:', 'bright');
  Object.entries(testPhases).forEach(([key, phase]) => {
    log(`  ${key.padEnd(8)} - ${phase.name}`, 'blue');
    log(`           ${phase.description}`, 'magenta');
  });
  
  log('\nExamples:', 'bright');
  log('  node test-client-journey.js --phase all --coverage', 'cyan');
  log('  node test-client-journey.js --phase e2e --watch', 'cyan');
  log('  node test-client-journey.js --phase 1-3 --verbose', 'cyan');
  log('  node test-client-journey.js --performance', 'cyan');
  
  log('\n');
}

function checkDependencies() {
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('❌ Jest not found. Please install dependencies with: npm install', 'red');
    return false;
  }
}

function runTests(options) {
  const { phase, coverage, watch, verbose, debug, performance, security } = options;
  
  let command = 'npx jest';
  
  // Add test pattern
  if (phase && testPhases[phase]) {
    command += ` --testPathPatterns=${testPhases[phase].pattern}`;
  } else if (phase && phase !== 'all') {
    log(`❌ Unknown phase: ${phase}`, 'red');
    log('Available phases: ' + Object.keys(testPhases).join(', '), 'yellow');
    return;
  } else {
    command += ' --testPathPatterns=client-journey';
  }
  
  // Add coverage
  if (coverage) {
    command += ' --coverage --coverageReporters=text --coverageReporters=html --coverageDirectory=coverage/client-journey';
  }
  
  // Add watch mode
  if (watch) {
    command += ' --watch';
  }
  
  // Add verbose output
  if (verbose || debug) {
    command += ' --verbose';
  }
  
  // Add debug options
  if (debug) {
    command += ' --no-cache --detectOpenHandles';
  }
  
  // Add specific test patterns
  if (performance) {
    command += ' --testNamePattern="Performance|Load"';
  }
  
  if (security) {
    command += ' --testNamePattern="Security|Authentication|Authorization"';
  }
  
  log(`\n🧪 Running: ${command}\n`, 'cyan');
  
  try {
    execSync(command, { stdio: 'inherit' });
    log('\n✅ Tests completed successfully!', 'green');
    
    if (coverage) {
      log('\n📊 Coverage report generated:', 'blue');
      log('  HTML: coverage/client-journey/index.html', 'magenta');
      log('  LCOV: coverage/client-journey/lcov.info', 'magenta');
    }
  } catch (error) {
    log('\n❌ Tests failed!', 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // Parse arguments
  const options = {
    phase: null,
    coverage: false,
    watch: false,
    verbose: false,
    debug: false,
    performance: false,
    security: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--phase':
        options.phase = args[++i];
        break;
      case '--coverage':
        options.coverage = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--performance':
        options.performance = true;
        break;
      case '--security':
        options.security = true;
        break;
      default:
        if (arg.startsWith('--')) {
          log(`❌ Unknown option: ${arg}`, 'red');
          log('Use --help to see available options', 'yellow');
          process.exit(1);
        }
    }
  }
  
  // Show what we're running
  if (options.phase && testPhases[options.phase]) {
    log(`🎯 Running Phase: ${testPhases[options.phase].name}`, 'bright');
    log(`   ${testPhases[options.phase].description}`, 'magenta');
  } else if (options.performance) {
    log('🏃 Running Performance Tests', 'bright');
  } else if (options.security) {
    log('🔒 Running Security Tests', 'bright');
  } else {
    log('🎯 Running All Client Journey Tests', 'bright');
  }
  
  // Run the tests
  runTests(options);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n⏹️  Test execution interrupted', 'yellow');
  process.exit(0);
});

// Run the main function
main();
