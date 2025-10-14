import axios from 'axios';
import chalk from 'chalk';
import dotenv from 'dotenv';
import schedule from 'node-schedule';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const COMPUTER_ID = process.env.COMPUTER_ID || '1';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 10; // seconds

let currentBooking = null;
let isLocked = true;

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════╗
║   Computer Booking System - Client Application    ║
║              Auto Unlock/Lock Manager             ║
╚═══════════════════════════════════════════════════╝
`;

console.log(chalk.cyan(banner));
console.log(chalk.yellow(`📡 Server: ${SERVER_URL}`));
console.log(chalk.yellow(`💻 Computer ID: ${COMPUTER_ID}`));
console.log(chalk.yellow(`⏱️  Check Interval: ${CHECK_INTERVAL}s\n`));

// Check if computer should be unlocked
async function checkUnlockStatus() {
  try {
    const response = await axios.post(`${SERVER_URL}/api/client/check-unlock`, {
      computer_id: COMPUTER_ID
    });

    const { shouldUnlock, booking, message } = response.data;

    if (shouldUnlock && booking) {
      if (!currentBooking || currentBooking.id !== booking.id) {
        console.log(chalk.green('\n✅ New booking detected!'));
        console.log(chalk.white(`   User: ${booking.user}`));
        console.log(chalk.white(`   Start: ${new Date(booking.start_time).toLocaleString('vi-VN')}`));
        console.log(chalk.white(`   End: ${new Date(booking.end_time).toLocaleString('vi-VN')}`));
        console.log(chalk.white(`   Unlock Code: ${booking.unlock_code}\n`));
        
        currentBooking = booking;
        await unlockComputer(booking.unlock_code);
      }
    } else {
      if (currentBooking && !shouldUnlock) {
        console.log(chalk.yellow('\n⏰ Booking time ended!'));
        await lockComputer();
        currentBooking = null;
      }
    }

    // Log status every 30 seconds
    const now = new Date();
    if (now.getSeconds() % 30 === 0) {
      if (isLocked) {
        console.log(chalk.gray(`[${now.toLocaleTimeString('vi-VN')}] 🔒 Computer is LOCKED - No active booking`));
      } else {
        console.log(chalk.green(`[${now.toLocaleTimeString('vi-VN')}] 🔓 Computer is UNLOCKED - Active booking`));
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red(`[${new Date().toLocaleTimeString('vi-VN')}] ❌ Cannot connect to server`));
    } else {
      console.error(chalk.red('Error checking unlock status:'), error.message);
    }
  }
}

// Unlock computer
async function unlockComputer(unlockCode) {
  try {
    const response = await axios.post(`${SERVER_URL}/api/client/unlock`, {
      computer_id: COMPUTER_ID,
      unlock_code: unlockCode
    });

    console.log(chalk.green.bold('🔓 COMPUTER UNLOCKED'));
    console.log(chalk.green(`   ${response.data.message}`));
    console.log(chalk.white(`   Session will end at: ${new Date(response.data.end_time).toLocaleString('vi-VN')}\n`));
    
    isLocked = false;
    
    // Simulate unlock (in production, this would interact with OS)
    await simulateUnlock();
  } catch (error) {
    console.error(chalk.red('❌ Failed to unlock computer:'), error.response?.data?.error || error.message);
  }
}

// Lock computer
async function lockComputer() {
  try {
    await axios.post(`${SERVER_URL}/api/client/lock`, {
      computer_id: COMPUTER_ID
    });

    console.log(chalk.red.bold('🔒 COMPUTER LOCKED'));
    console.log(chalk.white('   Session ended\n'));
    
    isLocked = true;
    
    // Simulate lock (in production, this would interact with OS)
    await simulateLock();
  } catch (error) {
    console.error(chalk.red('❌ Failed to lock computer:'), error.message);
  }
}

// Simulate unlock action (for demonstration)
async function simulateUnlock() {
  console.log(chalk.cyan('   → Disabling screen lock...'));
  console.log(chalk.cyan('   → Enabling user access...'));
  console.log(chalk.cyan('   → Starting user session...'));
  
  // In production, you would implement actual OS-level unlock here
  // For Windows: Use Windows API or PowerShell
  // For Linux: Disable lock screen, enable user
  
  // Example for Windows (commented out):
  // await execAsync('powershell -Command "Disable-ScreenSaver"');
  
  console.log(chalk.green('   ✓ Computer ready for use!\n'));
}

// Simulate lock action (for demonstration)
async function simulateLock() {
  console.log(chalk.yellow('   → Saving user session...'));
  console.log(chalk.yellow('   → Locking screen...'));
  console.log(chalk.yellow('   → Disabling user access...'));
  
  // In production, you would implement actual OS-level lock here
  // For Windows: rundll32.exe user32.dll,LockWorkStation
  // For Linux: Lock screen command
  
  // Example for Windows (commented out):
  // await execAsync('rundll32.exe user32.dll,LockWorkStation');
  
  console.log(chalk.red('   ✓ Computer locked!\n'));
}

// Check booking status at regular intervals
function startMonitoring() {
  console.log(chalk.green('🚀 Monitoring started!\n'));
  console.log(chalk.gray('Waiting for bookings...\n'));
  
  // Check immediately
  checkUnlockStatus();
  
  // Then check every interval
  setInterval(checkUnlockStatus, CHECK_INTERVAL * 1000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\n⚠️  Shutting down...'));
  
  if (!isLocked) {
    console.log(chalk.yellow('Locking computer before exit...'));
    await lockComputer();
  }
  
  console.log(chalk.green('👋 Goodbye!\n'));
  process.exit(0);
});

// Start the client application
startMonitoring();


