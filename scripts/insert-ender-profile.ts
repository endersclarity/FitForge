#!/usr/bin/env tsx

import { storage } from '../server/storage';
import { enderProfile } from './create-ender-profile';
import { setupDatabase } from './setup-database';

async function insertEnderProfile() {
  console.log("🚀 Setting up Ender's FitnessForge profile...");
  
  try {
    // First, ensure database is set up with exercises
    console.log("📚 Setting up exercise database...");
    await setupDatabase();
    
    console.log("👤 Creating Ender's user profile...");
    
    // Check if user already exists
    const existingUser = await storage.db
      .select()
      .from(storage.users)
      .where(storage.eq(storage.users.email, enderProfile.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log(`⏭️  User ${enderProfile.email} already exists, updating profile...`);
      
      // Update existing user with workout formulas and preferences
      await storage.db
        .update(storage.users)
        .set({
          workoutFormulas: enderProfile.workoutFormulas,
          exercisePreferences: enderProfile.exercisePreferences,
          firstName: enderProfile.firstName,
          lastName: enderProfile.lastName,
          username: enderProfile.username
        })
        .where(storage.eq(storage.users.email, enderProfile.email));
        
      console.log("✓ Updated existing user profile");
    } else {
      // Create new user
      const [newUser] = await storage.db
        .insert(storage.users)
        .values({
          username: enderProfile.username,
          email: enderProfile.email,
          firstName: enderProfile.firstName,
          lastName: enderProfile.lastName,
          password: 'demo-password', // For demo purposes
          workoutFormulas: enderProfile.workoutFormulas,
          exercisePreferences: enderProfile.exercisePreferences,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      console.log(`✓ Created new user: ${newUser.email}`);
    }
    
    // Verify the profile was created correctly
    const user = await storage.db
      .select()
      .from(storage.users)
      .where(storage.eq(storage.users.email, enderProfile.email))
      .limit(1);
    
    if (user.length > 0) {
      console.log("🎉 Profile setup complete!");
      console.log("📊 Profile Summary:");
      console.log(`   - Email: ${user[0].email}`);
      console.log(`   - Name: ${user[0].firstName} ${user[0].lastName}`);
      console.log(`   - Username: ${user[0].username}`);
      
      const workoutFormulas = user[0].workoutFormulas as any;
      if (workoutFormulas) {
        console.log("💪 Workout Formulas:");
        Object.entries(workoutFormulas).forEach(([type, exercises]: [string, any]) => {
          console.log(`   - ${type}: ${exercises.length} exercises`);
        });
      }
      
      const exercisePrefs = user[0].exercisePreferences as any;
      if (exercisePrefs) {
        console.log(`🎯 Exercise Preferences: ${Object.keys(exercisePrefs).length} exercises configured`);
      }
      
      console.log("\n🔑 Login Credentials:");
      console.log(`   Email: ${enderProfile.email}`);
      console.log(`   Password: Not required for demo (email-only login)`);
      
    } else {
      console.error("❌ Failed to verify profile creation");
    }
    
  } catch (error) {
    console.error("❌ Profile setup failed:", error);
    process.exit(1);
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  insertEnderProfile();
}

export { insertEnderProfile };