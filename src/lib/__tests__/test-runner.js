#!/usr/bin/env node

/**
 * Client Journey Test Runner
 * 
 * This script provides a comprehensive test runner for the client journey test suite.
 * It includes options for running specific phases, performance testing, and reporting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  phases: {
    1: { name: 'Registration & Onboarding', file: 'client-journey.test.ts' },
    2: { name: 'Dashboard & Discovery', file: 'client-journey.test.ts' },
    3: { name: 'Service Discovery & Booking', file: 'client-journey.test.ts' },
    4: { name: 'Payment Processing', file: 'client-journey-payment-academy.test.ts' },
    5: { name: 'Job Board Experience', file: 'client-journey-payment-academy.test.ts' },
    6: { name: 'Academy & Learning', file: 'client-journey-payment-academy.test.ts' },
    7: { name: 'Marketplace Shopping', file: 'client-journey-marketplace-financial.test.ts' },
    8: { name: 'Equipment Rental', file: 'client-journey-marketplace-financial.test.ts' },
    9: { name: 'Financial Management', file: 'client-journey-marketplace-financial.test.ts' },
    10: { name: 'Subscription Management', file: 'client-journey-subscription-communication.test.ts' },
    11: { name: 'Communication & Social', file: 'client-journey-subscription-communication.test.ts' },
    12: { name: 'Trust & Verification', file: 'client-journey-subscription-communication.test.ts' },
    13: { name: 'Referral System', file: 'client-journey-final-phases.test.ts' },
    14: { name: 'Analytics & Insights', file: 'client-journey-final-phases.test.ts' },
    15: { name: 'Activity & Social Features', file: 'client-journey-final-phases.test.ts' },
    16: { name: 'Settings & Preferences', file: 'client-journey-final-phases.test.ts' },
    17: { name: 'Profile Management', file: 'client-journey-final-phases.test.ts' },
    18: { name: 'Maps & Location Services', file: 'client-journey-final-phases.test.ts' }
  },
  testTypes: {
    unit: 'Unit tests for individual API endpoints',
    integration: 'Integration tests for multi-step workflows',
    e2e: 'End-to-end tests for complete user journeys',
    performance: 'Performance and load testing',
    security: 'Security and authentication testing',
    all: 'All test types combined'
  }
};

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

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logPhase(phase, name) {
  log(`\nPhase ${phase}: ${name}`, 'blue');
  log('-'.repeat(40), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Test execution functions
function runJestCommand(args) {
  try {
    const command = `npx jest ${args.join(' ')}`;
    logInfo(`Running: ${command}`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message,
      error: error.stderr || error.message
    };
  }
}

function runPhaseTests(phase) {
  const phaseConfig = TEST_CONFIG.phases[phase];
  if (!phaseConfig) {
    logError(`Invalid phase: ${phase}. Must be between 1-18.`);
    return false;
  }

  logPhase(phase, phaseConfig.name);
  
  const testFile = path.join(__dirname, phaseConfig.file);
  if (!fs.existsSync(testFile)) {
    logError(`Test file not found: ${testFile}`);
    return false;
  }

  const result = runJestCommand([testFile, '--verbose']);
  
  if (result.success) {
    logSuccess(`Phase ${phase} tests completed successfully`);
    return true;
  } else {
    logError(`Phase ${phase} tests failed`);
    console.log(result.output);
    return false;
  }
}

function runAllPhases() {
  logHeader('Running All Client Journey Phases');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (let phase = 1; phase <= 18; phase++) {
    const success = runPhaseTests(phase);
    results.push({ phase, success });
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  logHeader('Test Results Summary');
  log(`Total Phases: ${passed + failed}`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\nFailed Phases:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  - Phase ${r.phase}: ${TEST_CONFIG.phases[r.phase].name}`, 'red');
    });
  }

  return failed === 0;
}

function runE2ETests() {
  logHeader('Running End-to-End Integration Tests');
  
  const result = runJestCommand([
    'client-journey-e2e.test.ts',
    '--verbose',
    '--detectOpenHandles'
  ]);

  if (result.success) {
    logSuccess('E2E tests completed successfully');
    return true;
  } else {
    logError('E2E tests failed');
    console.log(result.output);
    return false;
  }
}

function runPerformanceTests() {
  logHeader('Running Performance Tests');
  
  const result = runJestCommand([
    '--testNamePattern="Performance Requirements"',
    '--verbose',
    '--detectOpenHandles'
  ]);

  if (result.success) {
    logSuccess('Performance tests completed successfully');
    return true;
  } else {
    logError('Performance tests failed');
    console.log(result.output);
    return false;
  }
}

function runSecurityTests() {
  logHeader('Running Security Tests');
  
  const result = runJestCommand([
    '--testNamePattern="Security"',
    '--verbose'
  ]);

  if (result.success) {
    logSuccess('Security tests completed successfully');
    return true;
  } else {
    logError('Security tests failed');
    console.log(result.output);
    return false;
  }
}

function runWithCoverage() {
  logHeader('Running Tests with Coverage');
  
  const result = runJestCommand([
    '--testPathPattern=client-journey',
    '--coverage',
    '--coverageReporters=text',
    '--coverageReporters=html',
    '--coverageDirectory=coverage/client-journey'
  ]);

  if (result.success) {
    logSuccess('Coverage report generated successfully');
    logInfo('Coverage report available at: coverage/client-journey/index.html');
    return true;
  } else {
    logError('Coverage generation failed');
    console.log(result.output);
    return false;
  }
}

function runSpecificTest(testName) {
  logHeader(`Running Specific Test: ${testName}`);
  
  const result = runJestCommand([
    '--testNamePattern="' + testName + '"',
    '--verbose'
  ]);

  if (result.success) {
    logSuccess(`Test "${testName}" completed successfully`);
    return true;
  } else {
    logError(`Test "${testName}" failed`);
    console.log(result.output);
    return false;
  }
}

function runWatchMode() {
  logHeader('Running Tests in Watch Mode');
  logInfo('Press Ctrl+C to exit watch mode');
  
  try {
    execSync('npx jest --testPathPattern=client-journey --watch', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    logError('Watch mode exited');
  }
}

function showHelp() {
  logHeader('Client Journey Test Runner');
  
  log('\nUsage:', 'bright');
  log('  node test-runner.js [command] [options]', 'cyan');
  
  log('\nCommands:', 'bright');
  log('  all                    Run all 18 phases of client journey tests', 'green');
  log('  phase <number>         Run specific phase (1-18)', 'green');
  log('  e2e                    Run end-to-end integration tests', 'green');
  log('  performance            Run performance tests', 'green');
  log('  security               Run security tests', 'green');
  log('  coverage               Run tests with coverage report', 'green');
  log('  test <name>            Run specific test by name', 'green');
  log('  watch                  Run tests in watch mode', 'green');
  log('  help                   Show this help message', 'green');
  
  log('\nPhases:', 'bright');
  for (let phase = 1; phase <= 18; phase++) {
    const config = TEST_CONFIG.phases[phase];
    log(`  ${phase.toString().padStart(2)}: ${config.name}`, 'cyan');
  }
  
  log('\nExamples:', 'bright');
  log('  node test-runner.js all', 'yellow');
  log('  node test-runner.js phase 1', 'yellow');
  log('  node test-runner.js e2e', 'yellow');
  log('  node test-runner.js coverage', 'yellow');
  log('  node test-runner.js test "should complete full user onboarding flow"', 'yellow');
  
  log('\nTest Types:', 'bright');
  Object.entries(TEST_CONFIG.testTypes).forEach(([key, description]) => {
    log(`  ${key.padEnd(12)}: ${description}`, 'cyan');
  });
}

function validateEnvironment() {
  logHeader('Environment Validation');
  
  // Check if Jest is available
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    logSuccess('Jest is available');
  } catch (error) {
    logError('Jest is not available. Please install dependencies with: npm install');
    return false;
  }
  
  // Check if test files exist
  const testFiles = [
    'client-journey.test.ts',
    'client-journey-payment-academy.test.ts',
    'client-journey-marketplace-financial.test.ts',
    'client-journey-subscription-communication.test.ts',
    'client-journey-final-phases.test.ts',
    'client-journey-e2e.test.ts'
  ];
  
  let allFilesExist = true;
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Test file found: ${file}`);
    } else {
      logError(`Test file missing: ${file}`);
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    logError('Some test files are missing. Please ensure all test files are present.');
    return false;
  }
  
  logSuccess('Environment validation completed');
  return true;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  // Validate environment first
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  let success = false;
  
  switch (command) {
    case 'all':
      success = runAllPhases();
      break;
      
    case 'phase':
      const phaseNumber = parseInt(args[1]);
      if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 18) {
        logError('Invalid phase number. Must be between 1-18.');
        process.exit(1);
      }
      success = runPhaseTests(phaseNumber);
      break;
      
    case 'e2e':
      success = runE2ETests();
      break;
      
    case 'performance':
      success = runPerformanceTests();
      break;
      
    case 'security':
      success = runSecurityTests();
      break;
      
    case 'coverage':
      success = runWithCoverage();
      break;
      
    case 'test':
      const testName = args.slice(1).join(' ');
      if (!testName) {
        logError('Test name is required. Usage: node test-runner.js test "test name"');
        process.exit(1);
      }
      success = runSpecificTest(testName);
      break;
      
    case 'watch':
      runWatchMode();
      return; // Watch mode handles its own exit
      
    default:
      logError(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
  
  if (success) {
    logSuccess('All tests completed successfully!');
    process.exit(0);
  } else {
    logError('Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

// Run the main function
main();
